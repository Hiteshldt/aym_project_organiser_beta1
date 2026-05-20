import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, itemHistory, folders, companyMembers, companies, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function getCompanyAccess(userId: string, slug: string) {
  const company = await db
    .select({ id: companies.id, name: companies.name, slug: companies.slug })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company[0]) return null;
  const member = await db
    .select({ role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, company[0].id), eq(companyMembers.userId, userId)))
    .limit(1);
  if (!member[0]) return null;
  return { company: company[0], role: member[0].role };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const folderId = searchParams.get("folderId");
  const recent = searchParams.get("recent");

  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  let query = db
    .select({
      id: items.id,
      title: items.title,
      type: items.type,
      url: items.url,
      fileKey: items.fileKey,
      fileName: items.fileName,
      fileSize: items.fileSize,
      folderId: items.folderId,
      tags: items.tags,
      notes: items.notes,
      itemDate: items.itemDate,
      isPinned: items.isPinned,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      createdByName: users.name,
      historyCount: sql<number>`(select count(*) from item_history where item_id = ${items.id})`.mapWith(Number),
    })
    .from(items)
    .innerJoin(users, eq(items.createdBy, users.id))
    .where(eq(items.companyId, access.company.id))
    .$dynamic();

  if (folderId) {
    query = query.where(and(eq(items.companyId, access.company.id), eq(items.folderId, folderId)));
  }

  const results = await query.orderBy(desc(items.isPinned), desc(items.createdAt)).limit(recent ? 10 : 500);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, folderId, title, type, url, fileKey, fileName, fileSize, tags, notes, itemDate } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  if (access.role !== "manager") return NextResponse.json({ error: "Managers only" }, { status: 403 });

  // Check duplicate URL
  if (url && type === "link") {
    const dup = await db
      .select({ id: items.id, title: items.title, folderId: items.folderId, createdAt: items.createdAt })
      .from(items)
      .where(and(eq(items.url, url), eq(items.companyId, access.company.id)))
      .limit(1);
    if (dup[0]) {
      const folder = await db.select({ name: folders.name }).from(folders).where(eq(folders.id, dup[0].folderId)).limit(1);
      return NextResponse.json({
        duplicate: true,
        existing: { ...dup[0], folderName: folder[0]?.name || "Unknown folder" },
      }, { status: 409 });
    }
  }

  const [item] = await db
    .insert(items)
    .values({
      title,
      type,
      url: url || null,
      fileKey: fileKey || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      folderId,
      companyId: access.company.id,
      tags: tags || [],
      notes: notes || null,
      itemDate: itemDate ? new Date(itemDate) : new Date(),
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, slug, title, tags, notes, itemDate, isPinned, updateNote } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [updated] = await db
    .update(items)
    .set({
      ...(title !== undefined && { title }),
      ...(tags !== undefined && { tags }),
      ...(notes !== undefined && { notes }),
      ...(itemDate !== undefined && { itemDate: new Date(itemDate) }),
      ...(isPinned !== undefined && { isPinned }),
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, id), eq(items.companyId, access.company.id)))
    .returning();

  if (updateNote) {
    await db.insert(itemHistory).values({
      itemId: id,
      updateNote,
      createdBy: session.user.id,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  if (!id || !slug) return NextResponse.json({ error: "id and slug required" }, { status: 400 });

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  await db.delete(items).where(and(eq(items.id, id), eq(items.companyId, access.company.id)));
  return NextResponse.json({ success: true });
}
