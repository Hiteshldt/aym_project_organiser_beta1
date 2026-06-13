import "server-only";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { db } from "@/db";
import { subscriptions, type Subscription } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, FREE_PLAN, type PlanTier, type Entitlements } from "./plans";

/* ────────────────────────────────────────────────────────────────
   Server-side Paddle client — lazy. If PADDLE_API_KEY isn't set,
   returns null so the app keeps running (everyone is on the free
   plan until billing is configured).
   ──────────────────────────────────────────────────────────────── */

let _paddle: Paddle | null = null;

export function getPaddle(): Paddle | null {
  if (_paddle) return _paddle;
  const key = process.env.PADDLE_API_KEY;
  if (!key) return null;
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? Environment.production
      : Environment.sandbox;
  _paddle = new Paddle(key, { environment });
  return _paddle;
}

export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** The tier a user is actually entitled to right now. */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  const sub = await getUserSubscription(userId);
  if (!sub) return FREE_PLAN;
  // Active, trialing, and past_due still grant access (Paddle retries dunning);
  // paused/canceled fall back to free.
  if (
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due"
  ) {
    return sub.planTier;
  }
  return FREE_PLAN;
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const tier = await getUserPlan(userId);
  return PLANS[tier].entitlements;
}
