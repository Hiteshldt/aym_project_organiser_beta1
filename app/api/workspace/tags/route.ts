import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Distinct tags across a workspace — powers tag autocomplete in the add form.
 * GET /api/workspace/tags?slug=...  →  ["brand", "deck", ...]
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const access = await db
    .select({ companyId: companies.id })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, session.user.id))
    )
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!access[0]) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const rows = await db.execute(
    sql`SELECT DISTINCT unnest(tags) AS tag FROM items WHERE company_id = ${access[0].companyId} ORDER BY tag`
  );
  const tags = (rows.rows as { tag: string }[]).map((r) => r.tag).filter(Boolean);
  return NextResponse.json(tags);
}
