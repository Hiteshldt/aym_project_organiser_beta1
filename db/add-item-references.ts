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

// Item-to-item references (cross-folder allowed) with an optional note.
// Cascade FKs mean deleting either item cleans up its references. Idempotent.
async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS item_references (
      id text PRIMARY KEY,
      item_id text NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      ref_item_id text NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      note varchar(300),
      created_by text NOT NULL REFERENCES users(id),
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ item_references table");

  await sql`CREATE INDEX IF NOT EXISTS item_refs_item_idx ON item_references (item_id)`;
  await sql`CREATE INDEX IF NOT EXISTS item_refs_ref_idx ON item_references (ref_item_id)`;
  console.log("✓ indexes");

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
