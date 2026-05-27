import { db } from "@/db";
import {
  clientShares,
  companies,
  folders,
  items,
  users,
} from "@/db/schema";
import { eq, and, isNull, desc, sql, gt, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public share endpoint — no authentication.
 * Looks up the token, verifies it's still active, then returns
 * the workspace data (company info + folders + items).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // 1. Look up the share and join the company
  const shareRow = await db
    .select({
      id: clientShares.id,
      companyId: clientShares.companyId,
      label: clientShares.label,
      expiresAt: clientShares.expiresAt,
      revokedAt: clientShares.revokedAt,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(clientShares)
    .innerJoin(companies, eq(companies.id, clientShares.companyId))
    .where(
      and(
        eq(clientShares.token, token),
        isNull(clientShares.revokedAt),
        // expiresAt is null OR in the future
        or(
          isNull(clientShares.expiresAt),
          gt(clientShares.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (!shareRow[0]) {
    return NextResponse.json(
      { error: "This share link is no longer active." },
      { status: 404 }
    );
  }

  const share = shareRow[0];

  // 2. Fire-and-forget: track last access (don't await — keep response fast)
  void db
    .update(clientShares)
    .set({ lastAccessedAt: new Date() })
    .where(eq(clientShares.id, share.id))
    .catch(() => {});

  // 3. Load folders + items in parallel
  const [allFolders, allItems] = await Promise.all([
    db
      .select()
      .from(folders)
      .where(eq(folders.companyId, share.companyId))
      .orderBy(folders.createdAt),

    db
      .select({
        id: items.id,
        title: items.title,
        type: items.type,
        url: items.url,
        fileName: items.fileName,
        fileSize: items.fileSize,
        folderId: items.folderId,
        folderName: folders.name,
        tags: items.tags,
        notes: items.notes,
        itemDate: items.itemDate,
        isPinned: items.isPinned,
        createdAt: items.createdAt,
        createdByName: users.name,
      })
      .from(items)
      .innerJoin(users, eq(items.createdBy, users.id))
      .innerJoin(folders, eq(items.folderId, folders.id))
      .where(eq(items.companyId, share.companyId))
      .orderBy(desc(items.isPinned), desc(items.createdAt))
      .limit(500),
  ]);

  return NextResponse.json({
    company: { name: share.companyName, slug: share.companySlug },
    label: share.label,
    folders: allFolders,
    items: allItems,
  });
}
