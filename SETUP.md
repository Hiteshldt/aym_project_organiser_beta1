# Ayuvam — Setup Guide

## 1. Create a Neon database

1. Go to https://console.neon.tech and create a free account
2. Create a new project (e.g. "ayuvam")
3. Copy the **Connection string** (it looks like `postgresql://...@...neon.tech/neondb?sslmode=require`)

## 2. Configure environment variables

Open `.env.local` and fill in:

```env
DATABASE_URL=postgresql://...your neon connection string...

# Generate with: openssl rand -base64 32
AUTH_SECRET=your-random-secret-here

# Leave blank for now if you don't need file uploads yet
BLOB_READ_WRITE_TOKEN=

NEXTAUTH_URL=http://localhost:3000
```

## 3. Push database schema

```bash
npm run db:push
```

This creates all the tables in your Neon database.

## 4. Seed the admin account

```bash
npm run db:seed
```

This creates: `admin@ayuvam.app` / `admin123456`

To use custom credentials:
```bash
SEED_ADMIN_EMAIL=you@company.com SEED_ADMIN_PASSWORD=yourpassword SEED_ADMIN_NAME="Your Name" npm run db:seed
```

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.
Log in with your admin credentials, then go to `/admin` to create users and companies.

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Import on https://vercel.com/new
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `AUTH_SECRET` — same random string (or generate a new one)
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://ayuvam.vercel.app`)
   - `BLOB_READ_WRITE_TOKEN` — from Vercel → Storage → Blob (for file uploads)
4. Deploy

After deploy, run the seed once with the Neon SQL editor or set up a one-time migration job.

---

## First-time workflow

1. Admin logs in at `/admin`
2. Creates users (managers and readers)
3. Creates a company (e.g. "Carbelim")
4. Assigns users to the company with a role
5. Managers log in and see their workspace at `/workspace`

## File uploads

File uploads use **Vercel Blob** (free tier: 1GB).
Without `BLOB_READ_WRITE_TOKEN`, the "File" option in Add Item will fail.
Links work without any extra setup.

---

## Tech

- **Next.js 14** (App Router)
- **Neon PostgreSQL** (serverless)
- **Drizzle ORM**
- **NextAuth.js v5** (credentials)
- **Vercel Blob** (file storage)
- **Tailwind CSS + Radix UI**
