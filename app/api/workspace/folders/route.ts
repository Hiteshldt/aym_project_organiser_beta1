import { auth } from "@/lib/auth";
import { db } from "@/db";
import { folders, companyMembers, companies } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
    .orderBy(folders.createdAt);

  return NextResponse.json(allFolders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, name, parentId, color } = body;

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

  await db.delete(folders).where(
    and(eq(folders.id, folderId), eq(folders.companyId, access.company.id))
  );
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, slug, name, color } = body;

  const access = await getCompanyAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [updated] = await db
    .update(folders)
    .set({ ...(name && { name }), ...(color && { color }) })
    .where(and(eq(folders.id, id), eq(folders.companyId, access.company.id)))
    .returning();

  return NextResponse.json(updated);
}
