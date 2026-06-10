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

// Per-workspace client-facing branding: an accent color for the share view
// header and an optional welcome note shown to the client. Idempotent.
async function main() {
  await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS accent_color varchar(20)`;
  console.log("✓ companies.accent_color");
  await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS client_note varchar(500)`;
  console.log("✓ companies.client_note");
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
