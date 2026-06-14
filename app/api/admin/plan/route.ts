import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { PLAN_ORDER, type PlanTier } from "@/lib/billing/plans";

/**
 * Manually set a user's plan tier — for comped accounts, beta testers, and
 * support fixes. Stored as a Paddle-less subscription row (priceId and
 * paddleSubscriptionId null), so the Paddle webhook never matches and never
 * clobbers it. If the user has a LIVE Paddle subscription, we refuse and send
 * the admin to Paddle (that's the source of truth for real money).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, tier } = (await req.json()) as {
    userId?: string;
    tier?: PlanTier;
  };
  if (!userId || !tier || !PLAN_ORDER.includes(tier)) {
    return NextResponse.json({ error: "userId and a valid tier are required" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing[0]?.paddleSubscriptionId) {
    return NextResponse.json(
      {
        error:
          "This user has a live Paddle subscription. Manage it from the Paddle dashboard, not here.",
      },
      { status: 409 }
    );
  }

  // Free === no entitlements beyond the base. Drop any manual row entirely.
  if (tier === "free") {
    if (existing[0]) {
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    }
    return NextResponse.json({ ok: true, tier });
  }

  await db
    .insert(subscriptions)
    .values({
      userId,
      planTier: tier,
      status: "active",
      priceId: null,
      paddleSubscriptionId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        planTier: tier,
        status: "active",
        priceId: null,
        paddleSubscriptionId: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true, tier });
}
