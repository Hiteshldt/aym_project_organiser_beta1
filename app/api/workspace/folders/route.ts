import { auth } from "@/lib/auth";
import { db } from "@/db";
import { folders, companyMembers, companies, items } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { deleteBlobs } from "@/lib/blob";

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
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const allFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.companyId, access.company.id))
    .orderBy(folders.position, folders.createdAt);

  return NextResponse.json(allFolders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, name, parentId, color, viewType } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  if (access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [folder] = await db
    .insert(folders)
    .values({
      name,
      companyId: access.company.id,
      parentId: parentId || null,
      color: color || "slate",
      viewType: viewType === "register" ? "register" : "cards",
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(folder, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("id");
  const slug = searchParams.get("slug");
  if (!folderId || !slug) return NextResponse.json({ error: "id and slug required" }, { status: 400 });

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  // Deleting a folder cascades to nested folders and every item inside them, so
  // collect the whole subtree's uploaded files first to free their blob storage.
  const companyFolders = await db
    .select({ id: folders.id, parentId: folders.parentId })
    .from(folders)
    .where(eq(folders.companyId, access.company.id));

  const subtree = new Set<string>([folderId]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of companyFolders) {
      if (f.parentId && subtree.has(f.parentId) && !subtree.has(f.id)) {
        subtree.add(f.id);
        changed = true;
      }
    }
  }

  const doomedItems = await db
    .select({ fileUrl: items.fileUrl, url: items.url })
    .from(items)
    .where(
      and(
        eq(items.companyId, access.company.id),
        inArray(items.folderId, [...subtree])
      )
    );

  await db.delete(folders).where(
    and(eq(folders.id, folderId), eq(folders.companyId, access.company.id))
  );

  await deleteBlobs(doomedItems.flatMap((i) => [i.fileUrl, i.url]));

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, slug, name, color, viewType, statusOptions } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [updated] = await db
    .update(folders)
    .set({
      ...(name && { name }),
      ...(color && { color }),
      ...((viewType === "cards" || viewType === "register") && { viewType }),
      ...(Array.isArray(statusOptions) && { statusOptions }),
    })
    .where(and(eq(folders.id, id), eq(folders.companyId, access.company.id)))
    .returning();

  return NextResponse.json(updated);
}
