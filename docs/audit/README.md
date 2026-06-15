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

1. **Plan limits not enforced** — only workspace count is checked; items (25),
   storage (100MB+), and members are unenforced → revenue leak + Blob cost.
   *(09/9.1, 07/7.2)*
2. **Preview deploys use the production DB + storage** — any branch/PR deploy
   reads/writes real data and can fire real side effects. *(06/6.1)*
3. **No backup / recovery posture** — hard cascade deletes, no soft-delete;
   confirm Neon PITR before paying customers. *(08/8.1)*
4. **Landing goes blank without JS** — `[data-reveal]{opacity:0}` revealed only
   by client JS; no fallback. *(01/1.1)*

## 🟠 Top P2s
- Wrong `metadataBase` domain (ayuvam.app → ayuvam.com). *(01/2.1)*
- Inaccurate "signed URLs" claim; files are public-by-URL. *(01/2.2, 07/7.1)*
- No type scale (70+ one-off font sizes); items table desktop-only on mobile;
  settings page wastes width. *(02)*
- No rate limiting on contact + login. *(03/3.1)*
- Search trgm index lives outside `schema.ts`; `db:push` may not create it.
  *(03/3.2, 08/8.2)*
- Sandbox→production Paddle switch needs a verified runbook; confirm "trial"
  claims are real. *(09/9.2, 9.3)*
- No email verification on password signup. *(05/5.1)*
- Move schema changes off `db:push` to migrations. *(08/8.2)*

## How to use this
1. Read each report, mark which findings you want fixed.
2. We batch the agreed fixes into focused PRs.
3. Re-verify, then connect the production Paddle account and launch.
