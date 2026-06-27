# Ayuvam — Changelog & Status

The single place to see **what changed and where the project stands**. Newest
entries first. Update this file whenever something meaningful ships.

---

## Current status — v1 (launch-ready)

| Area | State |
|---|---|
| **Database (Neon)** | ✅ Live — all 9 tables present, real data flowing |
| **Auth (NextAuth v5)** | ✅ Google OAuth + credentials sign-in; login rate-limited |
| **Email (Resend)** | ✅ Verified domain, sends from `hello@ayuvam.com` |
| **Storage (Vercel Blob)** | ✅ Token set in production (file uploads work) |
| **Payments (Paddle)** | ✅ Fully wired + sandbox-tested (checkout → webhook → subscription) |
| **Plan limits** | ✅ Enforced server-side (workspaces, items, storage) |
| **Marketing site** | ✅ Landing, pricing, contact, legal — all shipped |
| **App** | ✅ Workspaces, folders, items, search, ⌘K palette, installable PWA |

**To take real payments:** set `NEXT_PUBLIC_PADDLE_ENV=production` + production
tokens/prices in Vercel (sandbox stays for local). See `PADDLE.md`.

### Next up (post-launch)
- [ ] **Verify the welcome email** — run one subscription end-to-end and confirm
  the email arrives (watch Vercel logs for `[paddle] welcome email sent`).
- [ ] **Live sanity check** — the 10-step flow in `LAUNCH.md §6` on production.
- [ ] **Neon safety** (before scaling paid users) — confirm PITR/backups; add a
  Preview branch so PR deploys stop hitting prod data.
- [ ] *(optional)* Upstash for durable rate limiting; trigram search index.

### Deferred / known-minor (none block launch)
- **Trigram search index** not persisted in the DB — search works via a runtime
  fallback; a `gin_trgm` index would make it faster at scale.
- **Schema ships via `db:push`**, not migration files (intentional workflow).
- **Member cap** per workspace isn't hard-blocked (adding members is admin-only,
  so not a user-facing leak).
- **Infra (owner):** Neon Preview branch for PR-deploy isolation; confirm Neon
  PITR/backups before scaling paying customers.
- **Rate limiting** uses in-memory store unless `UPSTASH_*` env vars are set
  (optional durable upgrade — see `LAUNCH.md §5b`).

---

## 2026-06-27 — Welcome email on subscription

- Added a branded **welcome email** (Resend), sent automatically the first time
  a user's paid subscription activates. Fired from the Paddle webhook
  (`sendWelcomeEmail` in `lib/email.ts`); looks up the buyer's name/email,
  sends once (gated on first-seen subscription row), and is best-effort so it
  never fails the webhook. Paddle's own receipt is unchanged — this is our
  separate thank-you + "where to go next".

---

## 2026-06-27 — Pre-launch hardening, onboarding, docs

**Hardening**
- Removed false "trial" CTAs from pricing (no trial is configured; every CTA
  routes to `/login` → Free). "Start Solo/Studio trial" → "Start free".
- Added rate limiting (`lib/rate-limit.ts`): pluggable store — in-memory by
  default, auto-upgrades to Upstash Redis when `UPSTASH_*` vars are set, no SDK
  dependency, fails open. Login throttled 10/min per IP (distinct "Too many
  attempts" message); contact form 5/min per IP (429 + `Retry-After`).
- Confirmed email verification is moot: the only self-serve signup is
  Continue-with-Google (verified emails); no public password-registration route
  exists.

**Onboarding**
- Rebuilt the first-run wizard as two steps: name the workspace → pick starter
  folders (6 presets, 3 pre-checked, bulk-created). Smart CTA counts the picks;
  "Skip" creates the bare workspace. The existing guided empty state
  (`WelcomeSetup`) remains the fallback.

**Landing**
- Resolved the "One workspace per client" bento tile's vertical void (enriched
  the mini-cards with item rows, vertically centered the group).

**Docs & cleanup**
- Updated the architecture reference (`docs/index.html`).
- Added this changelog; folded in and removed the completed `docs/audit/`
  pre-launch findings log (recoverable via git history).
- Documented optional Upstash hardening in `LAUNCH.md`.

---

## Earlier (pre-changelog)

Captured in git history. Highlights: ⌘K command palette + installable PWA,
Settings rebuilt (Account/Billing/Security), item-limit ladder, Paddle billing
integration, mobile table fixes, and the full pre-launch audit (all P1/P2
resolved — see git log).
