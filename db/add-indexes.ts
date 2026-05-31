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

// Adds performance indexes idempotently — avoids drizzle-kit's interactive
// TTY prompt. Safe to run repeatedly.
async function main() {
  // item_history.item_id — backs the per-row historyCount subquery on every
  // item list. Without it that subquery full-scans item_history per row.
  await sql`CREATE INDEX IF NOT EXISTS item_history_item_idx ON item_history (item_id)`;
  console.log("✓ item_history_item_idx");

  // items (company_id, is_pinned, created_at) — backs the workspace list
  // query: filter by company, ordered pinned-first then newest-first.
  await sql`CREATE INDEX IF NOT EXISTS items_company_pinned_created_idx ON items (company_id, is_pinned, created_at)`;
  console.log("✓ items_company_pinned_created_idx");

  console.log("Indexes ensured. Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
