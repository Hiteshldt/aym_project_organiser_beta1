# Ayuvam — Launch & Operations Guide

*Things to set up outside the codebase. Do them in order.*

---

## 1. Apply the latest DB schema

```bash
npm run db:push
```

Drizzle diffs the schema in `db/schema.ts` against the live Neon DB and applies any new tables or columns. Safe to run multiple times.

Whenever you add to the schema, run this before deploying.

---

## 2. Google OAuth — Continue with Google

### 2.1 Create a Google Cloud project

1. **https://console.cloud.google.com** → New project → name it `Ayuvam`
2. **APIs & Services → OAuth consent screen** → User Type: External
3. App info:
   - **App name:** Ayuvam
   - **Authorized domains:** `ayuvam.com`
4. **Scopes:** add `email` and `profile`
5. **Test users:** add any Gmail you want to sign in with (required until app is verified)

### 2.2 Create OAuth credentials

1. **Credentials → + Create Credentials → OAuth client ID**
2. **Application type:** Web application
3. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://ayuvam.com`
4. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://ayuvam.com/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret** into `.env.local`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 2.3 Test

Restart `npm run dev`. Open `/login` → click "Continue with Google" → should consent and land on `/onboard`.

### 2.4 Remove the "unverified app" warning

Until you submit the app for Google verification, users see an "Advanced → Go to Ayuvam (unsafe)" warning. To remove:

1. OAuth consent screen → **Publish app**
2. Submit for verification (free, ~1 week)

---

## 3. Resend — Email from `hello@ayuvam.com`

### 3.1 Add the domain

1. **https://resend.com → Domains → Add Domain**
2. Enter `ayuvam.com` (apex domain)
3. Resend shows 3 DNS records (TXT, CNAME, MX) — copy them

### 3.2 Add DNS records

Where DNS lives (probably GoDaddy if that's where the domain is registered, or Cloudflare if migrated):

- Add each record exactly as Resend shows
- Type, host, and value matter
- DNS propagates in 5–30 minutes

### 3.3 Verify and set env vars

Once Resend shows ✅ on all three records:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@ayuvam.com
RESEND_FROM_NAME=Ayuvam
```

Restart dev server. Share invites now send from a branded address to anyone.

---

## 4. Vercel deployment

### 4.1 First deploy

1. Push the repo to GitHub
2. **https://vercel.com/new** → Import the repo
3. Add all env vars from `.env.local`:

```
DATABASE_URL
AUTH_SECRET
NEXTAUTH_URL          → set to https://ayuvam.com
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_FROM_NAME
BLOB_READ_WRITE_TOKEN (when ready for file uploads)
```

4. Deploy.

### 4.2 Custom domain

1. **Vercel → Settings → Domains** → add `ayuvam.com`
2. Vercel gives DNS records → add at your registrar
3. Wait for propagation

### 4.3 Vercel Blob (file uploads)

1. **Vercel → Storage → Create → Blob**
2. Copy the `BLOB_READ_WRITE_TOKEN`
3. Add to Vercel env vars and redeploy

---

## 5. Paddle — payments

### 5.1 Business verification

Paddle needs four URLs live before they activate the account:

- `https://ayuvam.com/pricing`
- `https://ayuvam.com/terms`
- `https://ayuvam.com/privacy`
- `https://ayuvam.com/refund`

All four exist in this repo under [app/(marketing)](../app/(marketing)). After deploying to production, submit your application from the Paddle dashboard. Review takes 24–48 hours.

### 5.2 After verification (next session)

Once Paddle is verified:

1. Create products in Paddle dashboard: Solo ($9 / $90), Studio ($19 / $190), Agency ($49 / $490)
2. Tell the dev assistant "Paddle is verified" with the price IDs
3. Integration will add: `/api/billing/checkout`, `/api/billing/webhook`, plan limits in the API, billing page in settings

### Why Paddle and not Stripe

Paddle is a Merchant of Record — they handle tax/VAT/GST globally and pay you in USD/INR. Stripe in India has restrictions that make it painful. Paddle is the standard for Indian SaaS founders selling globally.

---

## 6. Sanity check — does the whole flow work?

Run this in a fresh incognito window on the live site:

1. Visit `https://ayuvam.com` → landing page loads
2. Click **Start free** → `/login`
3. **Continue with Google** → consent → land on `/onboard`
4. Name your first workspace → `/workspace/[slug]`
5. Create a folder
6. Add an item (link)
7. **Share with client** → enter your own email
8. Check your inbox → branded email arrives from `hello@ayuvam.com`
9. Click the magic link → see the read-only client view
10. Pin and copy work; no edit controls visible on the client view

If all 10 steps pass, you're live.

---

*See also:* [DEV-SETUP.md](DEV-SETUP.md) · [TECHNICAL.md](TECHNICAL.md) · [ROADMAP.md](ROADMAP.md)
