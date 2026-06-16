import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkStorageHeadroom } from "@/lib/billing/storage";

/**
 * Preflight for file uploads: confirms the workspace owner's plan still has
 * storage headroom for a file of `size` bytes, BEFORE the browser uploads to
 * Blob. Doing it here (rather than only after upload) means an over-quota file
 * is rejected with a clear message and never leaves an orphaned blob behind.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, size } = (await req.json()) as { slug?: string; size?: number };
  if (!slug || typeof size !== "number" || size < 0) {
    return NextResponse.json({ error: "slug and size required" }, { status: 400 });
  }

  const result = await checkStorageHeadroom(session.user.id, slug, size);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: "PLAN_LIMIT", error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true });
}
