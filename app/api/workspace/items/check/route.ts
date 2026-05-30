import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, folders, companies, companyMembers } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Pure read endpoint for duplicate-URL checks.
 * - GET /api/workspace/items/check?slug=...&url=...&excludeId=...
 * - Returns { duplicate: false } or { duplicate: true, existing: {...} }
 * - NEVER mutates. The old flow of POSTing with _checkOnly accidentally
 *   created items on URL-blur — this endpoint fixes that root cause.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const url = searchParams.get("url");
  const excludeId = searchParams.get("excludeId");

  if (!slug || !url) {
    return NextResponse.json({ error: "slug and url required" }, { status: 400 });
  }

  // Verify membership (single JOIN — same pattern as other routes)
  const access = await db
    .select({ companyId: companies.id })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(
        eq(companyMembers.companyId, companies.id),
        eq(companyMembers.userId, session.user.id)
      )
    )
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!access[0]) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Look up the duplicate, excluding the item being edited (if any)
  const conditions = [
    eq(items.url, url),
    eq(items.companyId, access[0].companyId),
  ];
  if (excludeId) conditions.push(ne(items.id, excludeId));

  const dup = await db
    .select({
      id: items.id,
      title: items.title,
      folderId: items.folderId,
      folderName: folders.name,
      createdAt: items.createdAt,
    })
    .from(items)
    .innerJoin(folders, eq(folders.id, items.folderId))
    .where(and(...conditions))
    .limit(1);

  if (!dup[0]) {
    return NextResponse.json({ duplicate: false });
  }
  return NextResponse.json({ duplicate: true, existing: dup[0] });
}
