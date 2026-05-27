import type { Config } from "drizzle-kit";
import { readFileSync } from "fs";

// drizzle-kit CLI doesn't load .env.local automatically (Next.js does, but drizzle-kit doesn't)
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
