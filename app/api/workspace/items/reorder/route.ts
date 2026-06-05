import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Persist a manual drag-to-reorder. Body: { slug, orderedIds: string[] }.
 * Writes new positions for the listed items in one round-trip (CASE update),
 * scoped to the caller's workspace. Managers only.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, orderedIds } = await req.json();
  if (!slug || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "slug and orderedIds required" }, { status: 400 });
  }
  const ids = orderedIds.filter((x): x is string => typeof x === "string");

  const access = await db
    .select({ companyId: companies.id, role: companyMembers.role })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, session.user.id))
    )
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!access[0] || access[0].role !== "manager") {
    return NextResponse.json({ error: "Managers only" }, { status: 403 });
  }

  const cases = ids.map((id, i) => sql`WHEN ${id} THEN ${i}`);
  const idList = ids.map((id) => sql`${id}`);
  await db.execute(sql`
    UPDATE items SET position = CASE id ${sql.join(cases, sql` `)} ELSE position END
    WHERE company_id = ${access[0].companyId} AND id IN (${sql.join(idList, sql`, `)})
  `);

  return NextResponse.json({ success: true });
}
