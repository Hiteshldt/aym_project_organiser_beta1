import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  items,
  folders,
  itemReferences,
  companies,
  companyMembers,
} from "@/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function getAccess(userId: string, slug: string) {
  const rows = await db
    .select({ companyId: companies.id, role: companyMembers.role })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, userId))
    )
    .where(eq(companies.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Load id→{title, folderId, folderName} for a set of items in one query. */
async function itemDetails(ids: string[], companyId: string) {
  if (ids.length === 0) return new Map<string, { title: string; folderId: string; folderName: string }>();
  const rows = await db
    .select({
      id: items.id,
      title: items.title,
      folderId: items.folderId,
      folderName: folders.name,
    })
    .from(items)
    .innerJoin(folders, eq(items.folderId, folders.id))
    .where(and(inArray(items.id, ids), eq(items.companyId, companyId)));
  return new Map(rows.map((r) => [r.id, { title: r.title, folderId: r.folderId, folderName: r.folderName }]));
}

/**
 * GET /api/workspace/items/references?slug=&itemId=
 * → { outgoing: [{id, targetId, note, title, folderId, folderName}],
 *     incoming: [{id, targetId, note, title, folderId, folderName}] }
 * "targetId" is always the item on the other end of the reference.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const itemId = searchParams.get("itemId");
  if (!slug || !itemId) return NextResponse.json({ error: "slug and itemId required" }, { status: 400 });

  const access = await getAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Confirm the item belongs to this workspace before exposing its graph.
  const owner = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.companyId, access.companyId)))
    .limit(1);
  if (!owner[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(itemReferences)
    .where(or(eq(itemReferences.itemId, itemId), eq(itemReferences.refItemId, itemId)));

  const otherIds = [
    ...new Set(rows.map((r) => (r.itemId === itemId ? r.refItemId : r.itemId))),
  ];
  const details = await itemDetails(otherIds, access.companyId);

  const shape = (r: typeof rows[number], targetId: string) => {
    const d = details.get(targetId);
    if (!d) return null; // other end not visible in this workspace
    return { id: r.id, targetId, note: r.note, ...d };
  };

  return NextResponse.json({
    outgoing: rows
      .filter((r) => r.itemId === itemId)
      .map((r) => shape(r, r.refItemId))
      .filter(Boolean),
    incoming: rows
      .filter((r) => r.refItemId === itemId)
      .map((r) => shape(r, r.itemId))
      .filter(Boolean),
  });
}

/** POST { slug, itemId, refItemId, note? } — link two items in the workspace. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, itemId, refItemId, note } = await req.json();
  if (!slug || !itemId || !refItemId) {
    return NextResponse.json({ error: "slug, itemId, refItemId required" }, { status: 400 });
  }
  if (itemId === refItemId) {
    return NextResponse.json({ error: "An item can't reference itself" }, { status: 400 });
  }

  const access = await getAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  // Both ends must live in this workspace.
  const both = await db
    .select({ id: items.id })
    .from(items)
    .where(and(inArray(items.id, [itemId, refItemId]), eq(items.companyId, access.companyId)));
  if (both.length !== 2) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // No duplicate edges.
  const dup = await db
    .select({ id: itemReferences.id })
    .from(itemReferences)
    .where(and(eq(itemReferences.itemId, itemId), eq(itemReferences.refItemId, refItemId)))
    .limit(1);
  if (dup[0]) return NextResponse.json({ error: "Already referenced" }, { status: 409 });

  const [created] = await db
    .insert(itemReferences)
    .values({
      itemId,
      refItemId,
      note: (note ?? "").trim().slice(0, 300) || null,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

/** DELETE ?slug=&id= — remove a reference (manager). */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  if (!slug || !id) return NextResponse.json({ error: "slug and id required" }, { status: 400 });

  const access = await getAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  // Scope the delete through the owning item's company.
  const row = await db
    .select({ id: itemReferences.id, itemId: itemReferences.itemId })
    .from(itemReferences)
    .innerJoin(items, eq(items.id, itemReferences.itemId))
    .where(and(eq(itemReferences.id, id), eq(items.companyId, access.companyId)))
    .limit(1);
  if (!row[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(itemReferences).where(eq(itemReferences.id, id));
  return NextResponse.json({ success: true });
}
