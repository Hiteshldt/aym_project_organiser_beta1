import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, folders, companies, companyMembers } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/utils";

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

  // Compare normalized URLs so the same resource with different tracking /
  // view-state params (?gid, ?usp, #…) is recognised as one link.
  const target = normalizeUrl(url);
  const conditions = [
    eq(items.companyId, access[0].companyId),
    eq(items.type, "link"),
  ];
  if (excludeId) conditions.push(ne(items.id, excludeId));

  const candidates = await db
    .select({
      id: items.id,
      title: items.title,
      folderId: items.folderId,
      folderName: folders.name,
      createdAt: items.createdAt,
      url: items.url,
    })
    .from(items)
    .innerJoin(folders, eq(folders.id, items.folderId))
    .where(and(...conditions));

  const match = candidates.find((c) => c.url && normalizeUrl(c.url) === target);
  if (!match) {
    return NextResponse.json({ duplicate: false });
  }
  const { url: _omit, ...existing } = match;
  return NextResponse.json({ duplicate: true, existing });
}
