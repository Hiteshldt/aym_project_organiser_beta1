import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companies, companyMembers, folders, items, users } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export default async function WorkspaceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  // One round-trip: the company + this user's membership. LEFT JOIN so admins
  // who aren't members still resolve the company.
  const rows = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      accentColor: companies.accentColor,
      clientNote: companies.clientNote,
      role: companyMembers.role,
    })
    .from(companies)
    .leftJoin(
      companyMembers,
      and(
        eq(companyMembers.companyId, companies.id),
        eq(companyMembers.userId, session.user.id)
      )
    )
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!rows[0]) redirect("/workspace");

  const isAdmin = session.user.role === "admin";
  if (!rows[0].role && !isAdmin) redirect("/workspace");

  const company = {
    id: rows[0].id,
    name: rows[0].name,
    slug: rows[0].slug,
    accentColor: rows[0].accentColor,
    clientNote: rows[0].clientNote,
  };
  const userRole = isAdmin ? "admin" : rows[0].role || "reader";

  // Seed the shell with everything the first screen needs, fetched in parallel
  // — no client round-trips for folders / items / workspace list on first paint.
  const [allFolders, allItems, myCompanies] = await Promise.all([
    db
      .select()
      .from(folders)
      .where(eq(folders.companyId, company.id))
      .orderBy(folders.position, folders.createdAt),
    db
      .select({
        id: items.id,
        title: items.title,
        description: items.description,
        shortCode: items.shortCode,
        status: items.status,
        rowColor: items.rowColor,
        type: items.type,
        url: items.url,
        links: items.links,
        fileUrl: items.fileUrl,
        fileKey: items.fileKey,
        fileName: items.fileName,
        fileSize: items.fileSize,
        folderId: items.folderId,
        folderName: folders.name,
        tags: items.tags,
        notes: items.notes,
        itemDate: items.itemDate,
        isPinned: items.isPinned,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        createdByName: users.name,
        historyCount: sql<number>`(select count(*) from item_history where item_id = ${items.id})`.mapWith(Number),
      })
      .from(items)
      .innerJoin(users, eq(items.createdBy, users.id))
      .innerJoin(folders, eq(items.folderId, folders.id))
      .where(eq(items.companyId, company.id))
      .orderBy(desc(items.isPinned), asc(items.position), desc(items.createdAt))
      .limit(500),
    db
      .select({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        role: companyMembers.role,
      })
      .from(companyMembers)
      .innerJoin(companies, eq(companyMembers.companyId, companies.id))
      .where(eq(companyMembers.userId, session.user.id))
      .orderBy(companies.name),
  ]);

  return (
    <WorkspaceShell
      company={company}
      userRole={userRole}
      user={session.user}
      initialFolders={allFolders.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
      }))}
      initialItems={allItems.map((i) => ({
        ...i,
        itemDate: i.itemDate.toISOString(),
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))}
      initialCompanies={myCompanies}
    />
  );
}
