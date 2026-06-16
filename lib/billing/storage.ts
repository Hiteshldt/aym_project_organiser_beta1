import "server-only";
import { db } from "@/db";
import { items, companies, companyMembers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getEntitlements } from "./paddle-server";

export type StorageCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Can `actingUserId` (a manager of `slug`) add a file of `size` bytes without
 * exceeding the workspace OWNER's plan storage? Account-wide: storage is summed
 * across every workspace the owner owns. Shared by the upload preflight and the
 * token-mint backstop so the rule lives in one place.
 */
export async function checkStorageHeadroom(
  actingUserId: string,
  slug: string,
  size: number
): Promise<StorageCheck> {
  const [access] = await db
    .select({ ownerId: companies.createdBy, role: companyMembers.role })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(
        eq(companyMembers.companyId, companies.id),
        eq(companyMembers.userId, actingUserId)
      )
    )
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!access) return { ok: false, status: 403, error: "Not a member" };
  if (access.role !== "manager") {
    return { ok: false, status: 403, error: "Managers only" };
  }

  const { storageMb } = await getEntitlements(access.ownerId);
  if (storageMb === -1) return { ok: true };

  const [{ used }] = await db
    .select({
      used: sql<number>`coalesce(sum(${items.fileSize}), 0)`.mapWith(Number),
    })
    .from(items)
    .innerJoin(companies, eq(companies.id, items.companyId))
    .where(eq(companies.createdBy, access.ownerId));

  const limitBytes = storageMb * 1024 * 1024;
  if (used + size > limitBytes) {
    const label =
      storageMb >= 1024 ? `${(storageMb / 1024).toFixed(0)}GB` : `${storageMb}MB`;
    return {
      ok: false,
      status: 403,
      error: `This file would exceed your plan's ${label} of storage. Upgrade for more, or remove some files.`,
    };
  }

  return { ok: true };
}
