import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, itemHistory, folders, companyMembers, companies, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { generateShortCode } from "@/lib/shortcode";
import { normalizeUrl } from "@/lib/utils";

async function getCompanyAccess(userId: string, slug: string) {
  const result = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      role: companyMembers.role,
    })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, userId))
    )
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!result[0]) return null;
  return {
    company: { id: result[0].id, name: result[0].name, slug: result[0].slug },
    role: result[0].role,
  };
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

  const baseWhere = eq(items.companyId, access.company.id);

  const results = await db
    .select({
      id: items.id,
      title: items.title,
      description: items.description,
      shortCode: items.shortCode,
      type: items.type,
      url: items.url,
      fileKey: items.fileKey,
      fileName: items.fileName,
      fileSize: items.fileSize,
      folderId: items.folderId,
      folderName: folders.name,
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
    .innerJoin(folders, eq(items.folderId, folders.id))
    .where(folderId ? and(baseWhere, eq(items.folderId, folderId)) : baseWhere)
    .orderBy(desc(items.isPinned), desc(items.createdAt))
    .limit(recent ? 10 : 500);

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, folderId, title, description, type, url, fileKey, fileName, fileSize, tags, notes, itemDate, overrideDuplicate } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  if (access.role !== "manager") return NextResponse.json({ error: "Managers only" }, { status: 403 });

  // Duplicate check — skipped when the user explicitly chose "save as new anyway".
  // We compare normalized URLs so the same resource opened with different
  // tracking / view-state params (?gid, ?usp, #…) counts as one link.
  if (url && type === "link" && !overrideDuplicate) {
    const target = normalizeUrl(url);
    const candidates = await db
      .select({
        id: items.id,
        title: items.title,
        folderId: items.folderId,
        createdAt: items.createdAt,
        url: items.url,
        folderName: folders.name,
      })
      .from(items)
      .innerJoin(folders, eq(folders.id, items.folderId))
      .where(and(eq(items.companyId, access.company.id), eq(items.type, "link")));
    const match = candidates.find((c) => c.url && normalizeUrl(c.url) === target);
    if (match) {
      return NextResponse.json({
        duplicate: true,
        existing: {
          id: match.id,
          title: match.title,
          folderId: match.folderId,
          createdAt: match.createdAt,
          folderName: match.folderName,
        },
      }, { status: 409 });
    }
  }

  // Insert with a generated short code. The column is UNIQUE, so rather than
  // pre-checking we just let the DB enforce it and retry the (astronomically
  // rare) collision — one round-trip instead of two+ on the happy path.
  const baseValues = {
    title,
    description: description || null,
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
  };

  let item: typeof items.$inferSelect | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      [item] = await db
        .insert(items)
        .values({ ...baseValues, shortCode: generateShortCode() })
        .returning();
      break;
    } catch (e) {
      // 23505 = unique_violation; only retry the short-code clash.
      if ((e as { code?: string }).code === "23505" && attempt < 4) continue;
      throw e;
    }
  }

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, slug, title, description, url, tags, notes, itemDate, isPinned, updateNote } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [updated] = await db
    .update(items)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(url !== undefined && { url }),
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
