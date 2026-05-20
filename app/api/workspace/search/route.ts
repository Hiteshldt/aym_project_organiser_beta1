import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, folders, companyMembers, companies, users } from "@/db/schema";
import { eq, and, ilike, or, sql, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const type = searchParams.get("type") || "";

  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

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

  const conditions = [eq(items.companyId, company[0].id)];

  if (q) {
    conditions.push(
      or(
        ilike(items.title, `%${q}%`),
        ilike(items.notes, `%${q}%`),
        ilike(items.url, `%${q}%`),
        sql`${items.tags}::text ilike ${'%' + q + '%'}`
      )!
    );
  }

  if (tag) {
    conditions.push(sql`${tag} = ANY(${items.tags})`);
  }

  if (type === "link" || type === "file") {
    conditions.push(eq(items.type, type as "link" | "file"));
  }

  const results = await db
    .select({
      id: items.id,
      title: items.title,
      type: items.type,
      url: items.url,
      fileKey: items.fileKey,
      fileName: items.fileName,
      folderId: items.folderId,
      folderName: folders.name,
      tags: items.tags,
      notes: items.notes,
      itemDate: items.itemDate,
      isPinned: items.isPinned,
      createdAt: items.createdAt,
      createdByName: users.name,
      historyCount: sql<number>`(select count(*) from item_history where item_id = ${items.id})`.mapWith(Number),
    })
    .from(items)
    .innerJoin(folders, eq(items.folderId, folders.id))
    .innerJoin(users, eq(items.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(items.createdAt))
    .limit(100);

  return NextResponse.json(results);
}
