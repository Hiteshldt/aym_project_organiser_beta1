import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clientShares, companies, companyMembers, users } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { generateShareToken, buildShareUrl } from "@/lib/shares";
import { sendShareInvite } from "@/lib/email";

async function getManagerAccess(userId: string, slug: string) {
  const result = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      role: companyMembers.role,
    })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, userId))
    )
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!result[0]) return null;
  if (result[0].role !== "manager") return null;
  return {
    company: { id: result[0].id, name: result[0].name, slug: result[0].slug },
    role: result[0].role,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const access = await getManagerAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Managers only" }, { status: 403 });

  const shares = await db
    .select({
      id: clientShares.id,
      token: clientShares.token,
      label: clientShares.label,
      clientEmail: clientShares.clientEmail,
      createdAt: clientShares.createdAt,
      expiresAt: clientShares.expiresAt,
      revokedAt: clientShares.revokedAt,
      lastAccessedAt: clientShares.lastAccessedAt,
    })
    .from(clientShares)
    .where(
      and(
        eq(clientShares.companyId, access.company.id),
        isNull(clientShares.revokedAt)
      )
    )
    .orderBy(desc(clientShares.createdAt));

  return NextResponse.json(shares);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, label, clientEmail, expiresAt } = body;
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const access = await getManagerAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Managers only" }, { status: 403 });

  const token = generateShareToken();

  const [share] = await db
    .insert(clientShares)
    .values({
      companyId: access.company.id,
      token,
      label: label?.trim() || null,
      clientEmail: clientEmail?.trim() || null,
      createdBy: session.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  // If a client email was provided, send the invite. Failures don't block
  // share creation — we return the share with an `emailStatus` flag.
  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  let emailError: string | null = null;

  if (share.clientEmail) {
    const inviter = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const result = await sendShareInvite({
      to: share.clientEmail,
      studioName: access.company.name,
      label: share.label,
      shareUrl: buildShareUrl(share.token),
      inviterName: inviter[0]?.name ?? "Your contact",
    });

    if (result.ok) {
      emailStatus = "sent";
    } else {
      emailStatus = "failed";
      emailError = result.error;
      console.error("[shares] Email failed:", result.error);
    }
  }

  return NextResponse.json(
    { ...share, emailStatus, emailError },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  if (!id || !slug) {
    return NextResponse.json({ error: "id and slug required" }, { status: 400 });
  }

  const access = await getManagerAccess(session.user.id, slug);
  if (!access) return NextResponse.json({ error: "Managers only" }, { status: 403 });

  await db
    .update(clientShares)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(clientShares.id, id), eq(clientShares.companyId, access.company.id))
    );

  return NextResponse.json({ success: true });
}
