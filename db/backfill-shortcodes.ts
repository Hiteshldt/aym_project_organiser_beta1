import { neon } from "@neondatabase/serverless";
import { generateShortCode } from "../lib/shortcode";
import { readFileSync } from "fs";

// Load .env.local (tsx doesn't auto-load it)
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. Ensure the column exists (idempotent — avoids drizzle-kit's TTY prompt)
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS short_code varchar(16)`;

  // 2. Backfill any rows missing a short code
  const rows = await sql`SELECT id FROM items WHERE short_code IS NULL`;
  console.log(`Found ${rows.length} item(s) without a short code.`);

  for (const row of rows) {
    // retry on the rare collision
    let attempts = 0;
    while (attempts < 5) {
      const code = generateShortCode();
      try {
        await sql`UPDATE items SET short_code = ${code} WHERE id = ${row.id}`;
        break;
      } catch (e) {
        attempts++;
        if (attempts >= 5) throw e;
      }
    }
  }
  console.log(`Backfilled ${rows.length} short code(s).`);

  // 3. Add the unique index if it doesn't exist
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS items_short_code_unique ON items (short_code)`;
  console.log("Unique index ensured. Done.");

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
