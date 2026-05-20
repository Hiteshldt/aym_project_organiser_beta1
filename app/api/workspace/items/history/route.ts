import { auth } from "@/lib/auth";
import { db } from "@/db";
import { itemHistory, items, companyMembers, companies, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const slug = searchParams.get("slug");
  if (!itemId || !slug) return NextResponse.json({ error: "itemId and slug required" }, { status: 400 });

  // Verify access
  const company = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, company[0].id), eq(companyMembers.userId, session.user.id)))
    .limit(1);
  if (!member[0]) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const history = await db
    .select({
      id: itemHistory.id,
      updateNote: itemHistory.updateNote,
      createdAt: itemHistory.createdAt,
      createdByName: users.name,
    })
    .from(itemHistory)
    .innerJoin(users, eq(itemHistory.createdBy, users.id))
    .where(eq(itemHistory.itemId, itemId))
    .orderBy(desc(itemHistory.createdAt));

  return NextResponse.json(history);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, slug, updateNote } = await req.json();
  if (!itemId || !slug || !updateNote) {
    return NextResponse.json({ error: "itemId, slug, updateNote required" }, { status: 400 });
  }

  const company = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await db
    .select({ role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, company[0].id), eq(companyMembers.userId, session.user.id)))
    .limit(1);
  if (!member[0] || member[0].role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [entry] = await db
    .insert(itemHistory)
    .values({ itemId, updateNote, createdBy: session.user.id })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
