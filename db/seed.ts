import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@ayuvam.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123456";
  const adminName = process.env.SEED_ADMIN_NAME || "Admin";

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existing[0]) {
    console.log(`Admin already exists: ${adminEmail}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(schema.users).values({
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "admin",
  });

  console.log(`✓ Admin created: ${adminEmail} / ${adminPassword}`);
  console.log("  Change this password immediately after first login.");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
