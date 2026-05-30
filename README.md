# Ayuvam

> Make the work look as good as it is.

A clean client deliverables portal for studios, agencies, and freelancers.
Every client gets their own workspace. You organize. They open one link.
No Drive folder chaos.

**Live at:** https://ayuvam.com

---

## Documentation

All docs live in [`docs/`](docs/). Start here:

| Doc | What it is |
|---|---|
| **[PRODUCT.md](docs/PRODUCT.md)** | What Ayuvam is, who it's for, features, how it's used |
| **[TECHNICAL.md](docs/TECHNICAL.md)** | Stack, architecture, data model, key flows |
| **[ROADMAP.md](docs/ROADMAP.md)** | Current status, what's next, future plans |
| **[BRAND.md](docs/BRAND.md)** | Colors, typography, voice — the visual identity |
| **[LAUNCH.md](docs/LAUNCH.md)** | Operational setup — Google OAuth, Resend, Vercel, Paddle |
| **[DEV-SETUP.md](docs/DEV-SETUP.md)** | Run Ayuvam locally in 5 minutes |

---

## Quick start (local dev)

```bash
npm install
# Fill in .env.local with DATABASE_URL, AUTH_SECRET, and optional Google/Resend keys
npm run db:push
npm run dev
```

Then open http://localhost:3000.

Full setup: [docs/DEV-SETUP.md](docs/DEV-SETUP.md).

---

## Tech in a nutshell

Next.js 16 · Neon Postgres · Drizzle ORM · NextAuth v5 · Resend · Vercel Blob · Paddle (payments) · Tailwind CSS v4 · Instrument Serif + Geist

One repo. One deploy. No microservices.
