import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companyMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import OnboardWizard from "@/components/onboard/OnboardWizard";

export default async function OnboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Already has companies? Skip onboarding.
  const existing = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(eq(companyMembers.userId, session.user.id))
    .limit(1);

  if (existing[0]) redirect("/workspace");

  return (
    <OnboardWizard
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
    />
  );
}
