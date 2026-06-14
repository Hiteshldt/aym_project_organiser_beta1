import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, companyMembers, companies, items, subscriptions } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { FREE_PLAN, type PlanTier } from "@/lib/billing/plans";

const LIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [allUsers, wsCounts, itemCounts] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        planTier: subscriptions.planTier,
        subStatus: subscriptions.status,
        paddleSubscriptionId: subscriptions.paddleSubscriptionId,
      })
      .from(users)
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .orderBy(desc(users.createdAt)),
    db
      .select({ uid: companies.createdBy, c: count() })
      .from(companies)
      .groupBy(companies.createdBy),
    db
      .select({ uid: items.createdBy, c: count() })
      .from(items)
      .groupBy(items.createdBy),
  ]);

  const wsMap = new Map(wsCounts.map((r) => [r.uid, r.c]));
  const itemMap = new Map(itemCounts.map((r) => [r.uid, r.c]));

  const result = allUsers.map((u) => {
    const live = u.subStatus ? LIVE_STATUSES.has(u.subStatus) : false;
    const tier: PlanTier = live && u.planTier ? u.planTier : FREE_PLAN;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      tier,
      // A non-free tier without a Paddle subscription = comped/manual grant.
      comped: tier !== FREE_PLAN && !u.paddleSubscriptionId,
      workspaceCount: wsMap.get(u.id) ?? 0,
      itemCount: itemMap.get(u.id) ?? 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, email, password, role } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await db.delete(companyMembers).where(eq(companyMembers.userId, id));
  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
