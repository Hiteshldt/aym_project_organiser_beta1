import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const members = await db
    .select({
      id: companyMembers.id,
      role: companyMembers.role,
      userId: companyMembers.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(companyMembers)
    .innerJoin(users, eq(companyMembers.userId, users.id))
    .where(eq(companyMembers.companyId, companyId));

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { companyId, userId, role } = await req.json();
  if (!companyId || !userId || !role) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  // Check if already a member
  const existing = await db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
    .limit(1);

  if (existing[0]) {
    // Update role
    await db
      .update(companyMembers)
      .set({ role })
      .where(eq(companyMembers.id, existing[0].id));
    return NextResponse.json({ updated: true });
  }

  const [member] = await db
    .insert(companyMembers)
    .values({ companyId, userId, role })
    .returning();
  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await db.delete(companyMembers).where(eq(companyMembers.id, id));
  return NextResponse.json({ success: true });
}
