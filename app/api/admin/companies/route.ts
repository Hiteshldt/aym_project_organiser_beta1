import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, companyMembers, users, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/utils";
import { deleteBlobs } from "@/lib/blob";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      createdAt: companies.createdAt,
    })
    .from(companies)
    .orderBy(companies.createdAt);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const slug = slugify(name);
  const [company] = await db
    .insert(companies)
    .values({ name, slug, createdBy: session.user.id })
    .returning();
  return NextResponse.json(company, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Free every uploaded file in the workspace before the cascade removes the rows.
  const doomedItems = await db
    .select({ fileUrl: items.fileUrl, url: items.url })
    .from(items)
    .where(eq(items.companyId, id));

  await db.delete(companies).where(eq(companies.id, id));

  await deleteBlobs(doomedItems.flatMap((i) => [i.fileUrl, i.url]));

  return NextResponse.json({ success: true });
}
