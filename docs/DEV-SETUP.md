# Ayuvam — Developer Setup

*Local dev environment in 5 minutes.*

---

## 1. Prerequisites

- Node 20+
- A Neon Postgres database (free tier is fine — https://neon.tech)
- A Google Cloud OAuth client (for sign-in — see [LAUNCH.md §2](LAUNCH.md))
- A Resend account (for email — see [LAUNCH.md §3](LAUNCH.md))

---

## 2. Install

```bash
npm install
```

---

## 3. Configure environment

Copy `.env.example` to `.env.local` (or create new) with at minimum:

```env
# Neon — required
DATABASE_URL=postgresql://...

# Auth secret — generate one with: openssl rand -base64 32
AUTH_SECRET=...

# App URL
NEXTAUTH_URL=http://localhost:3000

# Resend — for sending share invite emails
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev   # until you verify your domain
RESEND_FROM_NAME=Ayuvam

# Google OAuth — for sign-in
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Vercel Blob — REQUIRED for file uploads (links-only works without it)
# Get it: Vercel dashboard → Storage → your Blob store → ".env.local" tab,
# or run `vercel env pull`. If this is blank, uploads fail with a 400 and the
# browser shows "Vercel Blob: Failed to retrieve the client token".
BLOB_READ_WRITE_TOKEN=
```

---

## 4. Push the schema

```bash
npm run db:push
```

This creates all tables in your Neon DB. Idempotent — safe to re-run anytime the schema changes.

---

## 5. Seed an admin (optional)

If you want a fallback admin account in addition to Google sign-in:

```bash
npm run db:seed
```

Creates `admin@ayuvam.app` / `admin123456` by default. Override:

```bash
SEED_ADMIN_EMAIL=you@example.com \
SEED_ADMIN_PASSWORD=your-password \
SEED_ADMIN_NAME="Your Name" \
npm run db:seed
```

---

## 6. Run

```bash
npm run dev
```

Open http://localhost:3000.

You should see the landing page. Click **Start free → Continue with Google** to sign in.

---

## 7. Useful commands

```bash
npm run dev          # Local dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Sync schema → DB (no migrations)
npm run db:generate  # Generate versioned SQL migrations
npm run db:migrate   # Apply versioned migrations
npm run db:seed      # Insert seed admin
npm run db:backfill-shortcodes  # One-time: give existing items short links
```

---

## 8. When you change the schema

1. Edit `db/schema.ts`
2. Run `npm run db:push` to apply to Neon
3. Commit `db/schema.ts`
4. If you want a versioned migration history, also run `npm run db:generate` first, commit the SQL file, then `npm run db:migrate` on prod

For early stage: `db:push` is fine. For prod safety later: use generate + migrate.

---

## 9. Project structure (quick map)

```
app/
  (marketing)/      Public — landing, pricing, terms, privacy, refund
  (auth)/login/     Sign in
  (onboard)/        First-time wizard
  (admin)/admin/    Platform admin
  (workspace)/      Product UI
  share/[token]/    Public client view
  api/              All API routes

components/
  ui/               Primitives
  marketing/        Landing-page components
  workspace/        Product UI components
  share/            Client view
  admin/            Admin tabs
  onboard/          Onboarding wizard

db/
  schema.ts         Single source of truth — all tables, enums, relations
  index.ts          Drizzle client

lib/
  auth.ts           NextAuth (Google + credentials)
  email.ts          Resend wrapper + share-invite template
  shares.ts         Token generator
  utils.ts          cn(), slugify(), formatDate, etc.

docs/               You are here
middleware.ts       Route protection
```

Full architecture details: [TECHNICAL.md](TECHNICAL.md).

---

*See also:* [LAUNCH.md](LAUNCH.md) · [TECHNICAL.md](TECHNICAL.md) · [ROADMAP.md](ROADMAP.md)
