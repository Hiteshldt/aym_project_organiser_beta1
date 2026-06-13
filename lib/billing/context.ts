import "server-only";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getUserSubscription } from "./paddle-server";
import { PLANS, FREE_PLAN, type PlanTier, type Entitlements } from "./plans";

export type BillingContext = {
  tier: PlanTier;
  status: string;
  entitlements: Entitlements;
  usage: { workspacesOwned: number };
  /** workspacesOwned >= limit (and limit !== unlimited) — block new, never existing. */
  atWorkspaceLimit: boolean;
  hasCustomer: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

/**
 * One call for everything the UI needs to show plan + usage. Free users (no
 * subscription row) resolve to the free plan. "Owned" workspaces = created by
 * this user; an account already over its limit (legacy) is reported as such so
 * the UI can nudge without ever removing what they have.
 */
export async function getBillingContext(userId: string): Promise<BillingContext> {
  const sub = await getUserSubscription(userId);

  const tier: PlanTier =
    sub &&
    (sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "past_due")
      ? sub.planTier
      : FREE_PLAN;

  const entitlements = PLANS[tier].entitlements;

  const [{ owned }] = await db
    .select({ owned: sql<number>`count(*)::int` })
    .from(companies)
    .where(eq(companies.createdBy, userId));

  const atWorkspaceLimit =
    entitlements.maxWorkspaces !== -1 && owned >= entitlements.maxWorkspaces;

  return {
    tier,
    status: sub?.status ?? "none",
    entitlements,
    usage: { workspacesOwned: owned },
    atWorkspaceLimit,
    hasCustomer: !!sub?.paddleCustomerId,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}
