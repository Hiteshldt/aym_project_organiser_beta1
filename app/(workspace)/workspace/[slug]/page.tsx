import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export default async function WorkspaceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const company = await db
    .select({ id: companies.id, name: companies.name, slug: companies.slug })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!company[0]) redirect("/workspace");

  const member = await db
    .select({ role: companyMembers.role })
    .from(companyMembers)
    .where(
      and(
        eq(companyMembers.companyId, company[0].id),
        eq(companyMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!member[0] && session.user.role !== "admin") redirect("/workspace");

  const userRole = session.user.role === "admin" ? "admin" : member[0]?.role || "reader";

  return (
    <WorkspaceShell
      company={company[0]}
      userRole={userRole}
      user={session.user}
    />
  );
}
