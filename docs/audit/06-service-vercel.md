# 06 · Service — Vercel (hosting / CI / env) — audit

Scope: deployment model, environments, env-var wiring, build.

**Overall:** standard, healthy Vercel setup — push-to-`main` auto-deploys, secrets
live in the dashboard (not committed). The one real risk is that **Preview
deployments share the Production database**.

---

## 🔴 P1

**6.1 — Preview deployments use the Production database.** Env vars
(`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, Paddle keys, etc.) are scoped to
**Production + Preview** (seen in the env list). That means any **preview/branch
deployment reads and writes your real production data and storage** — a test on
a PR could create/delete real workspaces, items, or blobs, and could even fire
real Paddle/email side effects.
- Fix: create a **Neon branch** (or separate DB) for the Preview environment and
  set `DATABASE_URL` (and ideally a separate Blob store + Paddle *sandbox* keys)
  on **Preview** only. Keep Production env values on Production only.
- Until then, treat every preview URL as live production and avoid destructive
  testing on them.

---

## 🟠 P2

**6.2 — `NEXT_PUBLIC_*` are build-time baked.** Any change to
`NEXT_PUBLIC_PADDLE_*`, etc. requires a **redeploy** to take effect (you hit this
already). Document it in the launch runbook so the sandbox→production Paddle
switch isn't half-applied.

**6.3 — No separate staging.** Production and Preview are the only environments,
and Preview points at prod data (6.1). A real staging environment (own DB +
sandbox Paddle) would let you rehearse the production launch safely.

---

## 🟡 P3

**6.4 — Observability is off.** Speed Insights and Web Analytics show "Not
Enabled". For launch, enabling Web Analytics (privacy-friendly, free tier) gives
you traffic/conversion data with one click — useful the moment marketing starts.

**6.5 — `metadataBase` wrong domain.** (Cross-ref landing 2.1) — affects what
Vercel serves for OG/canonical. Fix in `app/layout.tsx`.

**6.6 — Function regions / cold starts.** Neon (IAD1) and Blob (IAD1) are
us-east; ensure Vercel functions default to a nearby region to minimise DB
round-trip latency. Verify in project settings.

---

## ✅ Verified good
- CI/CD: every push to `main` builds and deploys; build is green (verified
  locally + last deploy "Ready").
- Secrets are in Vercel env, not in git; `.env.local` is gitignored.
- Custom domain `ayuvam.com` assigned with apex canonical (post the earlier
  www/apex fix).
