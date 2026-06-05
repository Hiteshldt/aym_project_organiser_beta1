import { db } from "@/db";
import { clientShares, companies, folders, items, users } from "@/db/schema";
import { eq, and, isNull, desc, or, gt } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ShareView from "@/components/share/ShareView";
import { LockKeyhole } from "lucide-react";

export const metadata: Metadata = {
  title: "Shared workspace",
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 16) notFound();

  // 1. Look up the share + company
  const shareRow = await db
    .select({
      id: clientShares.id,
      companyId: clientShares.companyId,
      label: clientShares.label,
      expiresAt: clientShares.expiresAt,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(clientShares)
    .innerJoin(companies, eq(companies.id, clientShares.companyId))
    .where(
      and(
        eq(clientShares.token, token),
        isNull(clientShares.revokedAt),
        or(
          isNull(clientShares.expiresAt),
          gt(clientShares.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (!shareRow[0]) {
    return <InvalidShareScreen />;
  }

  const share = shareRow[0];

  // 2. Update lastAccessedAt — fire-and-forget
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
        description: items.description,
        status: items.status,
        rowColor: items.rowColor,
        type: items.type,
        url: items.url,
        links: items.links,
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

  return (
    <ShareView
      company={{ name: share.companyName, slug: share.companySlug }}
      label={share.label ?? null}
      folders={allFolders.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
      }))}
      items={allItems.map((i) => ({
        ...i,
        itemDate: i.itemDate.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}

function InvalidShareScreen() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-ink leading-[1.1] tracking-[-0.02em]">
          This link <span className="font-display-italic">isn't active.</span>
        </h1>
        <p className="mt-4 text-mute text-sm">
          The workspace owner may have revoked the link, or it may have
          expired. Ask them for a fresh one.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          Visit Ayuvam
        </a>
      </div>
    </div>
  );
}
