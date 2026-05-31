import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public short-link resolver. No auth — anyone with the code is redirected
 * to the underlying item URL. Files and links both resolve to their url.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || code.length < 4 || code.length > 16) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const row = await db
    .select({ url: items.url })
    .from(items)
    .where(eq(items.shortCode, code))
    .limit(1);

  if (!row[0]?.url) {
    // Unknown code or item has no URL → home
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.redirect(row[0].url, { status: 302 });
}
