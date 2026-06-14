# Ayuvam — Admin Guide

The admin panel lives at **`/admin`** (e.g. `ayuvam.com/admin`). It's your
control room: who signed up, who's paying, what needs attention, and the few
manual actions a founder actually needs.

---

## Who can see it

Access is gated on the user's **global role** (`users.role`). Everyone signs up
as `manager` (self-serve) or `reader`; nobody is `admin` until you say so.

The check runs in two places — the `/admin` page and every `/api/admin/*`
route — so the data can't be reached without an admin session.

### Make yourself an admin (one time)

Run this once against the database (Neon → SQL editor, or any psql client):

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Then **sign out and back in** — your role is carried in the login token, so it
only refreshes on the next sign-in. Visit `/admin`.

> Local dev shortcut: `npm run db:seed` creates a fallback admin account
> (`admin@ayuvam.app` / `admin123456`) you can sign in with directly.

---

## What's on each tab

### Overview
The at-a-glance business picture:
- **Est. MRR / ARR** — computed live from active subscriptions. Annual plans
  count at their monthly-equivalent. Figures use the published list prices, so
  treat MRR as an estimate, not accounting truth.
- **Paying count** and **free → paid conversion %**
- **Total users** + new signups (24h / 7d / 30d)
- **14-day signups** bar chart
- **Plan mix** (Solo / Studio / Agency) and totals for workspaces, items, shares
- A banner that jumps to the churn list when any subscription needs attention

### Users
- Search by name or email; newest first
- Per user: role, plan tier, workspaces owned, items created, join date
- **Set plan** inline — see "Manual plan override" below
- Remove a user (deletes their memberships too)

### Subscriptions
- Revenue summary + plan counts
- **Needs attention** list: anyone scheduled to cancel (`cancel at period end`)
  or with a failing / paused payment, each with a deep-link to that customer in
  your Paddle dashboard (sandbox vs production aware).

### Workspaces
- Every client workspace, with member management (add / change role / remove).

---

## Manual plan override (comped accounts)

Use the **Plan** dropdown in the Users tab to grant a tier to friends, beta
testers, or as a support fix — no Paddle checkout required.

How it works and why it's safe:
- A manual grant is stored as a subscription row with **no Paddle IDs**, so the
  Paddle webhook never matches it and never overwrites your choice. These rows
  show a small **`comp`** tag.
- Setting someone to **Free** removes the manual row entirely.
- If the user has a **live Paddle subscription**, the override is refused —
  manage real paying customers from the Paddle dashboard (the source of truth
  for money), not here.

---

## Troubleshooting: file uploads

If uploading a file shows **"Vercel Blob: Failed to retrieve the client token"**
(HTTP 400), the storage token is missing from the environment:

- **Local:** set `BLOB_READ_WRITE_TOKEN` in `.env.local` (Vercel → Storage →
  your Blob store → `.env.local` tab, or `vercel env pull`).
- **Production:** ensure the Blob store is connected to the Vercel project so
  the token is injected, then redeploy.

Links-only items work without it; only file uploads need the token.
