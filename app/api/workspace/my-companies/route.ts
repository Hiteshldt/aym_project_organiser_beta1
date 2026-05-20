import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      role: companyMembers.role,
    })
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(eq(companyMembers.userId, session.user.id))
    .orderBy(companies.name);

  return NextResponse.json(myCompanies);
}
