import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, folders, companyMembers, companies, users } from "@/db/schema";
import { eq, and, ilike, or, sql, desc, SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────
   Strong search.
   - Splits the query into tokens.
   - Tokens that look like dates (ISO, slash, month name, 4-digit year)
     contribute to date filters. Day numbers only consumed when a date
     signal exists (so "v3" doesn't accidentally filter to day 3).
   - Remaining tokens are matched (case-insensitive, partial) against
     title, notes, url, and tag-array elements. All tokens must match
     somewhere — Google-style intersect.
   ────────────────────────────────────────────────────────────── */

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

type DateMatch = { year?: number; month?: number; day?: number };

function extractDateAndRemainder(query: string): {
  dateMatch: DateMatch | null;
  textTokens: string[];
} {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const textTokens: string[] = [];
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  let hasDateSignal = false;

  for (const t of tokens) {
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
    if (iso) {
      hasDateSignal = true;
      year = parseInt(iso[1]);
      month = parseInt(iso[2]);
      day = parseInt(iso[3]);
      continue;
    }
    const slash = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(t);
    if (slash) {
      hasDateSignal = true;
      day = parseInt(slash[1]);
      month = parseInt(slash[2]);
      year = parseInt(slash[3]);
      continue;
    }
    if (MONTHS[t] !== undefined) {
      hasDateSignal = true;
      month = MONTHS[t];
      continue;
    }
    if (/^\d{4}$/.test(t)) {
      const n = parseInt(t);
      if (n >= 2000 && n <= 2100) {
        hasDateSignal = true;
        year = n;
        continue;
      }
    }
    textTokens.push(t);
  }

  // Second pass: only consume day numbers if we already know we're in date mode
  if (hasDateSignal && day === undefined) {
    const remaining: string[] = [];
    for (const t of textTokens) {
      if (day === undefined && /^\d{1,2}$/.test(t)) {
        const n = parseInt(t);
        if (n >= 1 && n <= 31) {
          day = n;
          continue;
        }
      }
      remaining.push(t);
    }
    textTokens.length = 0;
    textTokens.push(...remaining);
  }

  return {
    dateMatch: hasDateSignal ? { year, month, day } : null,
    textTokens,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const q = (searchParams.get("q") || "").trim();
  const tag = searchParams.get("tag") || "";
  const type = searchParams.get("type") || "";

  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  // Single-query membership check (same pattern as items/folders)
  const access = await db
    .select({ companyId: companies.id })
    .from(companies)
    .innerJoin(
      companyMembers,
      and(
        eq(companyMembers.companyId, companies.id),
        eq(companyMembers.userId, session.user.id)
      )
    )
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!access[0]) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conditions: SQL[] = [eq(items.companyId, access[0].companyId)];

  if (q) {
    const { dateMatch, textTokens } = extractDateAndRemainder(q);

    // Date filters (additive — narrow by year/month/day independently)
    if (dateMatch?.year !== undefined) {
      conditions.push(sql`EXTRACT(YEAR FROM ${items.itemDate}) = ${dateMatch.year}`);
    }
    if (dateMatch?.month !== undefined) {
      conditions.push(sql`EXTRACT(MONTH FROM ${items.itemDate}) = ${dateMatch.month}`);
    }
    if (dateMatch?.day !== undefined) {
      conditions.push(sql`EXTRACT(DAY FROM ${items.itemDate}) = ${dateMatch.day}`);
    }

    // Text tokens: each must match somewhere (Google-style AND across fields).
    // We also match a space-stripped variant so "data sheet" finds tag
    // "datasheet" and "datasheet" finds a title "Data Sheet".
    for (const token of textTokens) {
      const pattern = `%${token}%`;
      const squashed = `%${token.replace(/[^a-z0-9]/g, "")}%`;
      const tokenCond = or(
        ilike(items.title, pattern),
        ilike(items.description, pattern),
        ilike(items.notes, pattern),
        ilike(items.url, pattern),
        ilike(items.fileName, pattern),
        // tag match (exact-ish, partial)
        sql`EXISTS (SELECT 1 FROM unnest(${items.tags}) AS tag WHERE tag ILIKE ${pattern})`,
        // space-stripped tag match — handles "data sheet" ↔ "datasheet"
        sql`EXISTS (SELECT 1 FROM unnest(${items.tags}) AS tag WHERE replace(tag, ' ', '') ILIKE ${squashed})`
      );
      if (tokenCond) conditions.push(tokenCond);
    }
  }

  if (tag) {
    conditions.push(sql`${tag} = ANY(${items.tags})`);
  }

  if (type === "link" || type === "file") {
    conditions.push(eq(items.type, type as "link" | "file"));
  }

  const selectFields = {
    id: items.id,
    title: items.title,
    description: items.description,
    shortCode: items.shortCode,
    type: items.type,
    url: items.url,
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
    createdByName: users.name,
    historyCount: sql<number>`(select count(*) from item_history where item_id = ${items.id})`.mapWith(Number),
  };

  const results = await db
    .select(selectFields)
    .from(items)
    .innerJoin(folders, eq(items.folderId, folders.id))
    .innerJoin(users, eq(items.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(items.isPinned), desc(items.createdAt))
    .limit(100);

  // Typo-tolerant fallback: if an exact match found nothing, return the closest
  // titles/descriptions by trigram similarity (pg_trgm).
  if (results.length === 0 && q) {
    const fuzzy = await db
      .select(selectFields)
      .from(items)
      .innerJoin(folders, eq(items.folderId, folders.id))
      .innerJoin(users, eq(items.createdBy, users.id))
      .where(
        and(
          eq(items.companyId, access[0].companyId),
          sql`(similarity(${items.title}, ${q}) > 0.2 OR similarity(coalesce(${items.description}, ''), ${q}) > 0.2)`
        )
      )
      .orderBy(sql`similarity(${items.title}, ${q}) DESC`)
      .limit(20);
    return NextResponse.json(fuzzy);
  }

  return NextResponse.json(results);
}
