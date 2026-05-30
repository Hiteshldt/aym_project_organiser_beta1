import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsShell from "@/components/settings/SettingsShell";

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
    />
  );
}
