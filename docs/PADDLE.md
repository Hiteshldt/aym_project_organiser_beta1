# Paddle billing — setup

Ayuvam uses **Paddle Billing** for paid subscriptions. The integration is
already built; this is the checklist to switch it on. Subscriptions belong to a
**user** (the studio owner). A user with no subscription row is on the **Free**
plan.

## How it fits together

| Piece | File |
| --- | --- |
| Plan catalog + entitlements + price↔tier map | `lib/billing/plans.ts` |
| Server Paddle client + plan/entitlement lookups | `lib/billing/paddle-server.ts` |
| Webhook (signature-verified, writes subscription state) | `app/api/webhooks/paddle/route.ts` |
| Customer portal session (manage/cancel/invoices) | `app/api/billing/portal/route.ts` |
| Upgrade UI + Paddle.js checkout | `components/billing/BillingPanel.tsx` (in Settings) |
| Subscription table | `db/schema.ts` → `subscriptions` |

The **marketing pricing page** still sends visitors to `/login` — paid checkout
happens in **Settings → Plan & billing** after they sign in (so we always have
their account id + email to stamp on the subscription).

## 1. Apply the database change

A new `subscriptions` table + two enums were added. Apply with **push** (the
workflow this repo uses — there are no migration files):

```bash
npm run db:push
```

It will detect only the new table/enums and apply them. Nothing else changes.

## 2. Create products & prices in Paddle (Catalog → Products)

Create one product per paid plan, each with a **monthly** and **annual** price.
Copy each price ID (looks like `pri_01h…`):

| Plan | Monthly | Annual |
| --- | --- | --- |
| Solo | $9 | $90 |
| Studio | $19 | $190 |
| Agency | $49 | $490 |

(Free has no Paddle price. Agency upgrade is currently "Talk to us" → `/contact`,
but its price IDs are wired up if you want self-serve later.)

## 3. Client-side token (Developer Tools → Authentication)

Create a **client-side token** for the **production** environment.

## 4. API key (Developer Tools → Authentication)

Create a **server-side API key** for production.

## 5. Webhook / notification destination (Developer Tools → Notifications)

- **Destination URL:** `https://ayuvam.com/api/webhooks/paddle`
- **Events:** subscribe to all `subscription.*` events
  (`subscription.created`, `subscription.activated`, `subscription.updated`,
  `subscription.canceled`, `subscription.paused`, `subscription.resumed`).
- Copy the **secret key** (`pdl_ntfset_…`).

The handler verifies every request's `Paddle-Signature` with this secret, so an
unsigned/forged call is rejected.

## 6. Environment variables

Add to `.env.local` (and to Vercel project settings for production):

```bash
# Environment: "production" once live, "sandbox" while testing
NEXT_PUBLIC_PADDLE_ENV=production

# Client-side token (step 3) — safe to expose, used by Paddle.js
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxxxxxxx

# Price IDs (step 2) — also client-side (needed to open checkout)
NEXT_PUBLIC_PADDLE_PRICE_SOLO_MONTHLY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_SOLO_ANNUAL=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_STUDIO_MONTHLY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_STUDIO_ANNUAL=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_AGENCY_MONTHLY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_AGENCY_ANNUAL=pri_xxx

# Server-only secrets (NEVER prefixed NEXT_PUBLIC) — steps 4 & 5
PADDLE_API_KEY=apikey_xxxxxxxx
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxx
```

> Until `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` is set, the billing panel shows a quiet
> "Billing isn't connected yet" note and everyone stays on Free — nothing breaks.

## 7. Default payment link (Checkout → Checkout settings)

Set the default payment link to `https://ayuvam.com` (must be a real,
domain-verified URL — not localhost). Required by Paddle for live checkout.

## 8. Test the loop

1. Set the env vars, restart the app.
2. Settings → Plan & billing → **Upgrade to Solo/Studio** → complete checkout.
3. Paddle fires `subscription.created` → the webhook writes the `subscriptions`
   row → reloading Settings shows the new plan + "Manage billing".
4. **Manage billing** opens the Paddle-hosted customer portal.

While testing, use `NEXT_PUBLIC_PADDLE_ENV=sandbox` with sandbox tokens/prices
and Paddle's test cards before flipping to `production`.

## Entitlements (what each tier grants)

Defined in `lib/billing/plans.ts` → `PLANS`. To enforce a limit somewhere, call
`getEntitlements(userId)` (server) and check before allowing the action — e.g.
gate "create workspace" on `maxWorkspaces`. Enforcement is intentionally **not**
wired into existing flows yet, so no one gets locked out unexpectedly; add it
deliberately per feature.
