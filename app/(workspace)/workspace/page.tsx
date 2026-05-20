import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companyMembers, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import CompanySelectorShell from "@/components/workspace/CompanySelectorShell";

export default async function WorkspacePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

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

  if (myCompanies.length === 1) {
    redirect(`/workspace/${myCompanies[0].slug}`);
  }

  return <CompanySelectorShell companies={myCompanies} user={session.user} />;
}
