# 09 · Service — Paddle (billing) — audit

Scope: `lib/billing/*`, `app/api/webhooks/paddle/route.ts`,
`app/api/billing/portal/route.ts`, `app/api/workspace/companies/route.ts`
(enforcement), checkout client, plan catalog. Currently on **sandbox**; will
move to production for launch.

**Overall:** the integration mechanics are sound — signature-verified webhook,
idempotent upserts, Merchant-of-Record (Paddle handles tax/receipts). The
critical gap is that **the plans you sell are mostly not enforced**, which leaks
revenue and storage cost.

---

## 🔴 P1

**9.1 — Plan limits are advertised but not enforced (revenue + cost leak).**
Only `maxWorkspaces` is checked (`companies/route.ts:47`). Everything else in
`PLANS`/`PLAN_DISPLAY` is unenforced:
- **Items** — Free is sold as "25 items", but `items` POST has no count check; a
  free account can create unlimited items.
- **Storage** — `storageMb` (100MB → 50GB) is never checked on upload; a free
  user can upload unlimited 20MB files (cross-ref Blob 7.2). This costs *you*
  money.
- **Team members** — `maxMembersPerWorkspace` isn't enforced on member add.
- **White-label / custom subdomain** (Agency-only) — confirm these are gated.
Before connecting the real Paddle account, enforce each limit server-side
(return the existing `PLAN_LIMIT` 403 pattern) so the pricing page is truthful
and Free can't be used as an unlimited tier.

---

## 🟠 P2

**9.2 — Sandbox → production switch is multi-variable; make it a runbook.**
Going live means swapping *all* of these in Vercel Production **and redeploying**
(the `NEXT_PUBLIC_*` are build-time baked):
- `NEXT_PUBLIC_PADDLE_ENV=production`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (live)
- `NEXT_PUBLIC_PADDLE_PRICE_*` (all six live price IDs)
- `PADDLE_API_KEY` (live), `PADDLE_WEBHOOK_SECRET` (live notification dest)
- Register the **production** webhook URL in Paddle → `…/api/webhooks/paddle`.
A half-applied switch (e.g. live client token but sandbox price IDs) silently
breaks checkout. Write it down; verify a real test purchase after.

**9.3 — "Trial" claims vs reality.** The marketing CTAs say "Start Solo/Studio
trial" (cross-ref landing 2.3). Confirm the Paddle prices are actually configured
with a trial period; if not, either configure trials or change the copy. A
"trial" that immediately charges is a refund/chargeback magnet.

---

## 🟡 P3

**9.4 — Downgrade / cancellation doesn't reconcile over-limit usage.** If a user
on Studio (unlimited workspaces) downgrades to Solo (5), nothing handles the
workspaces already over the new cap. Decide the policy (block new, lock extras
read-only, or grace period) and implement on `subscription.updated`.

**9.5 — Manual comp grants vs webhook.** The admin manual-plan feature stores
Paddle-less rows so the webhook won't clobber them, and refuses override on live
subscriptions — verify this holds once on the production Paddle account (it was
built/tested against sandbox).

**9.6 — Past-due / failed payment UX.** The webhook stores `past_due`/`paused`
and the admin churn list surfaces them, but confirm the *user* sees a dunning
prompt (banner + portal link) so they can fix a failed card before losing
access.

---

## ✅ Verified good
- Webhook verifies `Paddle-Signature` via `webhooks.unmarshal` before trusting
  any payload.
- Upserts keyed by user/subscription id → idempotent for duplicate or
  out-of-order webhook deliveries.
- Merchant of Record: Paddle handles VAT/sales tax and emails the
  receipt/invoice automatically (no code needed).
- Billing portal session created server-side (`customerPortalSessions.create`)
  for self-serve manage/cancel.
- Plan catalog centralised in `lib/billing/plans.ts` (the marketing duplication
  in 01/2.4 should read from here).
