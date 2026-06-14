import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  companies,
  items,
  clientShares,
  subscriptions,
} from "@/db/schema";
import { and, count, eq, gte, inArray, ne, or, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { PLAN_DISPLAY, priceMap, type PlanTier } from "@/lib/billing/plans";

// Always compute fresh — these are live business numbers.
export const dynamic = "force-dynamic";

// Statuses that count as a live, paying (or soon-to-pay) subscription.
const LIVE_STATUSES = ["active", "trialing", "past_due"] as const;

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const dayMs = 86_400_000;
  const since = (days: number) => new Date(now - days * dayMs);

  const [
    totalUsersR,
    signups24R,
    signups7R,
    signups30R,
    workspacesR,
    itemsR,
    sharesR,
  ] = await Promise.all([
    db.select({ v: count() }).from(users),
    db.select({ v: count() }).from(users).where(gte(users.createdAt, since(1))),
    db.select({ v: count() }).from(users).where(gte(users.createdAt, since(7))),
    db.select({ v: count() }).from(users).where(gte(users.createdAt, since(30))),
    db.select({ v: count() }).from(companies),
    db.select({ v: count() }).from(items),
    db.select({ v: count() }).from(clientShares),
  ]);

  const totalUsers = totalUsersR[0]?.v ?? 0;

  // Live paying subscriptions — derive plan mix + estimated MRR.
  const paying = await db
    .select({
      tier: subscriptions.planTier,
      priceId: subscriptions.priceId,
    })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, [...LIVE_STATUSES]),
        ne(subscriptions.planTier, "free")
      )
    );

  const prices = priceMap();
  const byTier: Record<Exclude<PlanTier, "free">, number> = {
    solo: 0,
    studio: 0,
    agency: 0,
  };
  let mrr = 0;
  for (const s of paying) {
    const tier = s.tier as PlanTier;
    if (tier === "free") continue;
    byTier[tier] += 1;
    const disp = PLAN_DISPLAY[tier];
    const isAnnual = !!s.priceId && prices[tier]?.annual === s.priceId;
    // Annual plans contribute their monthly-equivalent to MRR.
    mrr += isAnnual ? disp.annual / 12 : disp.monthly;
  }
  const payingCount = paying.length;

  // Churn risk: scheduled to cancel, or payment is failing / paused.
  const churn = await db
    .select({
      userId: subscriptions.userId,
      name: users.name,
      email: users.email,
      tier: subscriptions.planTier,
      status: subscriptions.status,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      paddleCustomerId: subscriptions.paddleCustomerId,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(
      or(
        eq(subscriptions.cancelAtPeriodEnd, true),
        inArray(subscriptions.status, ["past_due", "paused"])
      )
    )
    .orderBy(subscriptions.currentPeriodEnd);

  // 14-day signups sparkline, bucketed by calendar day (oldest → newest).
  const recent = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(gte(users.createdAt, since(14)));

  const buckets: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    buckets.push({ date: key, count: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const r of recent) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const i = idx.get(key);
    if (i !== undefined) buckets[i].count += 1;
  }

  return NextResponse.json({
    users: {
      total: totalUsers,
      last24h: signups24R[0]?.v ?? 0,
      last7d: signups7R[0]?.v ?? 0,
      last30d: signups30R[0]?.v ?? 0,
    },
    content: {
      workspaces: workspacesR[0]?.v ?? 0,
      items: itemsR[0]?.v ?? 0,
      shares: sharesR[0]?.v ?? 0,
    },
    revenue: {
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      payingCount,
      conversion: totalUsers ? payingCount / totalUsers : 0,
      byTier,
    },
    churn: churn.map((c) => ({
      ...c,
      currentPeriodEnd: c.currentPeriodEnd?.toISOString() ?? null,
    })),
    signups: buckets,
  });
}
