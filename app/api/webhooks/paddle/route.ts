import { NextRequest, NextResponse } from "next/server";
import { getPaddle } from "@/lib/billing/paddle-server";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { tierForPriceId, PLANS, type PlanTier } from "@/lib/billing/plans";
import { sendWelcomeEmail } from "@/lib/email";

// Webhooks must run per-request (raw body + signature); never cache/prerender.
export const dynamic = "force-dynamic";

type SubStatus = (typeof subscriptions.status.enumValues)[number];

// Paddle subscription statuses → our enum.
const STATUS_MAP: Record<string, SubStatus> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  paused: "paused",
  canceled: "canceled",
};

// Structural view of a Paddle subscription notification — kept local so we
// don't couple to the SDK's exact generic types.
type SubLike = {
  id: string;
  status?: string;
  customerId?: string | null;
  customData?: Record<string, unknown> | null;
  items?: Array<{ price?: { id?: string | null } | null }> | null;
  currentBillingPeriod?: { endsAt?: string | null } | null;
  scheduledChange?: { action?: string | null } | null;
};

export async function POST(req: NextRequest) {
  const paddle = getPaddle();
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!paddle || !secret) {
    console.error("[paddle] webhook hit but PADDLE_API_KEY/SECRET not set");
    return NextResponse.json({ error: "Billing not configured" }, { status: 500 });
  }

  const signature = req.headers.get("paddle-signature") ?? "";
  // Raw body is required — any transformation breaks signature verification.
  const raw = await req.text();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(raw, secret, signature);
  } catch (e) {
    console.error("[paddle] signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (!event) {
    return NextResponse.json({ error: "Unhandled" }, { status: 400 });
  }

  console.log(`[paddle] webhook received: ${event.eventType}`);

  try {
    switch (event.eventType) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
      case "subscription.resumed":
      case "subscription.paused":
      case "subscription.canceled": {
        const result = await upsertSubscription(event.data as unknown as SubLike);
        // Send our own welcome email exactly once — the first time we record a
        // paid, live subscription for this user. Best-effort: a failure here
        // must never 500 the webhook (Paddle would retry → duplicate email).
        if (
          result.isNew &&
          result.userId &&
          result.planTier !== "free" &&
          (result.status === "active" || result.status === "trialing")
        ) {
          await maybeSendWelcome(result.userId, result.planTier);
        }
        break;
      }
      default:
        // Acknowledge everything else (transaction.*, customer.*, …) so Paddle
        // doesn't retry; we only persist subscription state here.
        break;
    }
  } catch (e) {
    console.error("[paddle] handler error:", e);
    // 500 → Paddle retries with backoff.
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

type UpsertResult = {
  /** True only when this user had no subscription row before this event. */
  isNew: boolean;
  userId: string | null;
  planTier: PlanTier;
  status: SubStatus;
};

async function upsertSubscription(sub: SubLike): Promise<UpsertResult> {
  const userId =
    typeof sub.customData?.userId === "string"
      ? (sub.customData.userId as string)
      : null;

  const priceId = sub.items?.[0]?.price?.id ?? null;
  const planTier: PlanTier = tierForPriceId(priceId);
  const status: SubStatus = STATUS_MAP[sub.status ?? ""] ?? "active";
  const currentPeriodEnd = sub.currentBillingPeriod?.endsAt
    ? new Date(sub.currentBillingPeriod.endsAt)
    : null;
  const cancelAtPeriodEnd = sub.scheduledChange?.action === "cancel";

  const values = {
    paddleCustomerId: sub.customerId ?? null,
    paddleSubscriptionId: sub.id,
    priceId,
    planTier,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    updatedAt: new Date(),
  };

  // Prefer the userId we stamped at checkout (customData). Fall back to the
  // Paddle subscription ID for events that arrive without it (e.g. updates).
  if (userId) {
    // Was there already a row for this user? Drives the once-only welcome email.
    const existing = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    const isNew = existing.length === 0;

    await db
      .insert(subscriptions)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: subscriptions.userId, set: values });
    console.log(
      `[paddle] subscription ${sub.id} → user ${userId}: ${planTier}/${status}${isNew ? " (new)" : ""}`
    );
    return { isNew, userId, planTier, status };
  }
  console.warn(
    `[paddle] subscription ${sub.id} had no customData.userId; updating by sub id`
  );

  // No userId on the event — update the existing row keyed by subscription ID.
  await db
    .update(subscriptions)
    .set(values)
    .where(eq(subscriptions.paddleSubscriptionId, sub.id));
  return { isNew: false, userId: null, planTier, status };
}

/** Look up the buyer and send the welcome email. Never throws. */
async function maybeSendWelcome(userId: string, planTier: PlanTier) {
  try {
    const [u] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u?.email) {
      console.warn(`[paddle] welcome skipped — no email for user ${userId}`);
      return;
    }
    const planName = PLANS[planTier]?.name ?? "Pro";
    const res = await sendWelcomeEmail({
      to: u.email,
      name: u.name ?? "",
      planName,
    });
    if (res.ok) {
      console.log(`[paddle] welcome email sent to ${u.email} (${planName})`);
    } else {
      console.error(`[paddle] welcome email failed: ${res.error}`);
    }
  } catch (e) {
    console.error("[paddle] welcome email error:", e);
  }
}
