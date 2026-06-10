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

// Lets one item carry BOTH a link and a file: the uploaded blob URL moves to
// file_url, freeing `url` for the user's link. Legacy file items keep their
// blob URL in `url` (display falls back). Idempotent.
async function main() {
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS file_url text`;
  console.log("✓ items.file_url");
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
