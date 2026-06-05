import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load .env.local (tsx doesn't auto-load it)
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const sql = neon(process.env.DATABASE_URL!);

// Manual ordering (drag-to-reorder) + typo-tolerant search. Idempotent.
async function main() {
  // ── Ordering ──────────────────────────────────────────────────
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0`;
  console.log("✓ items.position");
  await sql`ALTER TABLE folders ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0`;
  console.log("✓ folders.position");

  // Backfill positions from current created_at order, scoped per folder / per
  // parent. Only touches rows still at the default 0 so re-runs are safe.
  await sql`
    UPDATE items SET position = sub.rn
    FROM (
      SELECT id, row_number() OVER (PARTITION BY folder_id ORDER BY created_at) - 1 AS rn
      FROM items
    ) sub
    WHERE items.id = sub.id
      AND items.position = 0
  `;
  console.log("✓ items positions backfilled");

  await sql`
    UPDATE folders SET position = sub.rn
    FROM (
      SELECT id, row_number() OVER (PARTITION BY company_id, parent_id ORDER BY created_at) - 1 AS rn
      FROM folders
    ) sub
    WHERE folders.id = sub.id
      AND folders.position = 0
  `;
  console.log("✓ folders positions backfilled");

  // ── Fuzzy search ──────────────────────────────────────────────
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  console.log("✓ pg_trgm extension");
  await sql`CREATE INDEX IF NOT EXISTS items_title_trgm ON items USING gin (title gin_trgm_ops)`;
  console.log("✓ items_title_trgm index");

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
