# Ayuvam — Pre-launch Audit

A step-by-step audit toward a clean **v1** — finding hidden bugs, gaps, and
optimisation opportunities before the testing phase and (real) Paddle + marketing.

**This is a findings log, not a changelog.** Nothing here is fixed yet. Each
report lists issues with a location, severity, and a recommended fix, so we can
triage and implement deliberately afterwards.

## Severity legend

| Tag | Meaning |
|---|---|
| 🔴 **P1** | Bug or risk that should block v1 (broken behaviour, data loss, security, money) |
| 🟠 **P2** | Should fix before marketing — visible polish, UX friction, or latent bug |
| 🟡 **P3** | Nice-to-have — refinement, consistency, optimisation |

## Areas & status

| # | Area | Report | Status |
|---|------|--------|--------|
| 01 | Landing / marketing site | [01-landing-page.md](01-landing-page.md) | ✅ done |
| 02 | Frontend — main app UI | [02-frontend-app-ui.md](02-frontend-app-ui.md) | ✅ done |
| 03 | Backend — API routes & data | [03-backend.md](03-backend.md) | ✅ done |
| 04 | Service — Resend (email) | [04-service-resend.md](04-service-resend.md) | ✅ done |
| 05 | Service — Google OAuth | [05-service-google-oauth.md](05-service-google-oauth.md) | ✅ done |
| 06 | Service — Vercel (host/CI) | [06-service-vercel.md](06-service-vercel.md) | ✅ done |
| 07 | Service — Vercel Blob (storage) | [07-service-blob.md](07-service-blob.md) | ✅ done |
| 08 | Service — Neon (database) | [08-service-neon.md](08-service-neon.md) | ✅ done |
| 09 | Service — Paddle (billing) | [09-service-paddle.md](09-service-paddle.md) | ✅ done |

## 🔴 Consolidated P1s (must fix for a clean v1)

1. ✅ **FIXED — Plan limits not enforced.** Item cap (Free = 50/workspace; paid
   tiers unlimited) enforced on item create; storage cap enforced via an upload
   preflight + server backstop (`lib/billing/storage.ts`); workspace count
   enforced on create. All resolve against the workspace **owner's** plan. Member
   cap is admin-only to add, so not a user-facing leak — left for later.
   *(09/9.1, 07/7.2)*
2. ⏳ **Preview deploys use the production DB + storage** — infra, needs your
   action (Neon branch + Preview-scoped env). See "Owner action items" below.
   *(06/6.1)*
3. ⏳ **No backup / recovery posture** — confirm Neon PITR (infra); optional
   soft-delete is a code change for a later batch. *(08/8.1)*
4. ✅ **FIXED — Landing blank without JS.** Added a `<noscript>` fallback that
   forces reveal; RevealProvider already had a JS-side failsafe. *(01/1.1)*

## 🟠 Top P2s
- ✅ **FIXED** — `metadataBase` now `ayuvam.com`. *(01/2.1)*
- ✅ **FIXED** — "signed URLs" FAQ claim reworded to the accurate public-URL
  posture. *(01/2.2, 07/7.1)*
- ✅ **FIXED** — Settings rebuilt as Account/Billing/Security tabs; register
  row font sizes normalised to a consistent scale; items table now renders as
  stacked cards on mobile (was a 720px horizontal-scroll). Verified via
  headless screenshots at 390/500/760/1280. *(02)*
- ✅ **SHIPPED** — ⌘K/Ctrl+K command palette (live search, keyboard nav, open
  link/file) and installable PWA (web manifest + generated app icons + an
  in-app "Install app" button). Verified via headless screenshots. *(02)*
- ✅ **DOCUMENTED** — Sandbox→production Paddle switch now has a verified
  step-by-step runbook in `docs/PADDLE.md`. *(09/9.2)*
- ⚠️ **Still open — confirm "trial" claims are real** before marketing them
  (pricing/CTAs say "Start trial"; verify Paddle prices have trial periods, or
  reword). *(09/9.3)*
- ⚠️ **Still open — no rate limiting on contact + login.** Worth adding before
  public exposure (login brute-force, contact spam). *(03/3.1)*
- ⚠️ **Still open — no email verification on password signup.** *(05/5.1)*
- 🟡 Search trgm index lives outside `schema.ts`; `db:push` may not create it
  (there's a runtime fallback, so search still works). *(03/3.2, 08/8.2)*
- 🟡 Move schema changes off `db:push` to migrations. *(08/8.2)*

## 🔧 Owner action items (infra — I can't do these from code)
- **P1.2** Create a Neon branch for the **Preview** environment and set
  `DATABASE_URL` (+ a separate Blob store and Paddle *sandbox* keys) on Preview
  only, so PR/branch deploys stop touching production data.
- **P1.3** Confirm Neon plan has point-in-time recovery / backups enabled before
  onboarding paying customers.

## How to use this
1. Read each report, mark which findings you want fixed.
2. We batch the agreed fixes into focused PRs.
3. Re-verify, then connect the production Paddle account and launch.
