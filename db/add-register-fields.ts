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

// Adds the register-revamp columns idempotently — avoids drizzle-kit's
// interactive TTY prompt. Safe to run repeatedly.
async function main() {
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS status varchar(60)`;
  console.log("✓ items.status");

  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS row_color varchar(20)`;
  console.log("✓ items.row_color");

  await sql`ALTER TABLE folders ADD COLUMN IF NOT EXISTS status_options jsonb`;
  console.log("✓ folders.status_options");

  console.log("Register fields ensured. Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
