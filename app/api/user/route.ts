import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET — return the signed-in user's profile.
 * PATCH — update name and/or password.
 *
 * Auth path tied to /api/auth/* is reserved for NextAuth — that's why
 * this lives at /api/user.
 */

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      hasPassword: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    role: user[0].role,
    createdAt: user[0].createdAt,
    // Don't leak the hash, just whether one is set (OAuth users have empty hash)
    hasPassword: !!user[0].hasPassword,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  // Name update
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    if (name.length > 100) {
      return NextResponse.json({ error: "Name too long (max 100)" }, { status: 400 });
    }
    updates.name = name;
  }

  // Password update — must provide current password (or be OAuth user with no password yet)
  if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be 8 characters or more" },
        { status: 400 }
      );
    }
    const existing = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (existing[0]?.passwordHash) {
      // Has a password — require current password to change it
      if (typeof body.currentPassword !== "string" || !body.currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        );
      }
      const ok = await bcrypt.compare(body.currentPassword, existing[0].passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }
    // OAuth user setting a password for the first time — no current password required
    updates.passwordHash = await bcrypt.hash(body.newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.user.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return NextResponse.json(updated);
}
