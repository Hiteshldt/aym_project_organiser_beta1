import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

/** Returns the company + the caller's role, or null if they aren't a member. */
async function memberAccess(userId: string, slug: string) {
  const rows = await db
    .select({ id: companies.id, name: companies.name, role: companyMembers.role })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, userId))
    )
    .where(eq(companies.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Self-service workspace creation. Any signed-in user can create a workspace
 * (= a client space). The creator is automatically added as a manager.
 *
 * Distinct from /api/admin/companies which is for system admins (Hitesh)
 * managing the whole platform.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (name.length > 60) {
    return NextResponse.json(
      { error: "Name must be 60 characters or fewer" },
      { status: 400 }
    );
  }

  // Generate a unique slug
  const baseSlug = slugify(name);
  if (!baseSlug) {
    return NextResponse.json(
      { error: "Name must contain letters or numbers" },
      { status: 400 }
    );
  }

  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!existing[0]) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
    if (attempt > 50) {
      return NextResponse.json(
        { error: "Could not generate a unique slug" },
        { status: 500 }
      );
    }
  }

  // Create company + membership in a single transaction-ish pair
  const [company] = await db
    .insert(companies)
    .values({
      name,
      slug,
      createdBy: session.user.id,
    })
    .returning();

  await db.insert(companyMembers).values({
    companyId: company.id,
    userId: session.user.id,
    role: "manager",
  });

  return NextResponse.json(company, { status: 201 });
}

/**
 * Update a workspace: rename and/or client-facing branding (accent color,
 * welcome note). Slug stays stable so share links / bookmarks don't break.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, name, accentColor, clientNote } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const trimmed = name !== undefined ? (name ?? "").trim() : undefined;
  if (trimmed !== undefined) {
    if (!trimmed) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (trimmed.length > 60) {
      return NextResponse.json({ error: "Name must be 60 characters or fewer" }, { status: 400 });
    }
  }

  const access = await memberAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const [updated] = await db
    .update(companies)
    .set({
      ...(trimmed !== undefined && { name: trimmed }),
      ...(accentColor !== undefined && { accentColor: accentColor || null }),
      ...(clientNote !== undefined && {
        clientNote: (clientNote ?? "").trim().slice(0, 500) || null,
      }),
    })
    .where(eq(companies.id, access.id))
    .returning();

  return NextResponse.json(updated);
}

/** Delete a workspace and everything in it (folders, items, shares cascade). */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const access = await memberAccess(session.user.id, slug);
  if (!access || access.role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  await db.delete(companies).where(eq(companies.id, access.id));
  return NextResponse.json({ success: true });
}
