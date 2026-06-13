import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsShell from "@/components/settings/SettingsShell";
import { getUserSubscription } from "@/lib/billing/paddle-server";
import { FREE_PLAN, type PlanTier } from "@/lib/billing/plans";
import type { BillingProps } from "@/components/billing/BillingPanel";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user[0]) redirect("/login");

  const sub = await getUserSubscription(user[0].id);
  const activeTier: PlanTier =
    sub &&
    (sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "past_due")
      ? sub.planTier
      : FREE_PLAN;

  const billing: BillingProps = {
    userId: user[0].id,
    email: user[0].email,
    currentTier: activeTier,
    status: sub?.status ?? "none",
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    hasCustomer: !!sub?.paddleCustomerId,
  };

  return (
    <SettingsShell
      user={{
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
        createdAt: user[0].createdAt.toISOString(),
        hasPassword: !!user[0].passwordHash,
      }}
      billing={billing}
    />
  );
}
