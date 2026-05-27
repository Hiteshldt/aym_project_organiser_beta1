# Ayuvam — Launch Setup Guide

Things you need to do **outside the codebase** to take this from "working locally" to "ready to launch." Do them in order.

---

## 1. Apply latest DB schema

If you haven't run `db:push` since we added `client_shares`, do it now.

```bash
cd "/Users/hiteshgupta/Vs Code/hitesh/files-organiser"
npm run db:push
```

If it asks anything, accept the defaults (create new table, don't rename).

---

## 2. Google OAuth — "Continue with Google" sign-in

You need to register Ayuvam with Google so the OAuth flow works.

### 2.1  Create a Google Cloud project

1. Go to **https://console.cloud.google.com**
2. Top bar → click the project dropdown → **New project**
3. Name it `Ayuvam` (or anything you like)
4. Click **Create**, then make sure it's selected in the project dropdown

### 2.2  Configure the OAuth consent screen

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. **User Type:** External → **Create**
3. Fill in:
   - **App name:** `Ayuvam`
   - **User support email:** your email
   - **App logo:** skip for now (add when you have a real logo)
   - **App domain:** `https://ayuvam.com` (leave blank if not deployed yet)
   - **Authorized domains:** `ayuvam.com`
   - **Developer contact email:** your email
4. Click **Save and Continue**
5. **Scopes:** click **Add or remove scopes** → tick **email** and **profile** → **Update**
6. **Save and Continue**
7. **Test users:** add your own Gmail address(es) — without verifying the app, only listed test users can sign in. (To remove this limit, you submit for verification later; not needed for early users.)
8. **Save and Continue** → **Back to Dashboard**

### 2.3  Create OAuth credentials

1. Left sidebar → **APIs & Services** → **Credentials**
2. Top → **+ Create Credentials** → **OAuth client ID**
3. **Application type:** Web application
4. **Name:** `Ayuvam Web`
5. **Authorized JavaScript origins** — add both:
   ```
   http://localhost:3000
   https://ayuvam.com
   ```
6. **Authorized redirect URIs** — add both:
   ```
   http://localhost:3000/api/auth/callback/google
   https://ayuvam.com/api/auth/callback/google
   ```
   *(If you deploy under a different domain — e.g. `ayuvam.vercel.app` — add that one too.)*
7. **Create**

A modal pops up with two values: **Client ID** and **Client secret**.

### 2.4  Add to `.env.local`

Open `.env.local` and paste:

```env
GOOGLE_CLIENT_ID=paste-the-client-id-here
GOOGLE_CLIENT_SECRET=paste-the-client-secret-here
```

Then restart the dev server (`Ctrl+C`, then `npm run dev`).

### 2.5  Test

1. Open http://localhost:3000/login
2. Click **Continue with Google**
3. Approve the consent screen (you'll see a "this app isn't verified" warning — that's normal until you submit for verification; click "Advanced" → "Go to Ayuvam (unsafe)")
4. You should land on `/onboard` (your first sign-in) and be asked to name your first workspace

---

## 3. Resend — Send from `hello@ayuvam.com`

You have the domain. Time to send invites from a proper address instead of `onboarding@resend.dev`.

### 3.1  Add the domain in Resend

1. Go to **https://resend.com** → **Domains** → **Add Domain**
2. Enter `ayuvam.com` (apex domain, not `mail.ayuvam.com` — keeps it cleaner)
3. Resend shows you **3 DNS records** to add. They'll look like:

```
TXT   send.ayuvam.com     "v=spf1 include:amazonses.com ~all"
CNAME resend._domainkey   resend._domainkey.resend.com
MX    send.ayuvam.com     feedback-smtp.us-east-1.amazonses.com (priority 10)
```

*(Exact values vary — copy them from Resend's UI, not from this guide.)*

### 3.2  Add the DNS records

This depends on where you bought `ayuvam.com`. Common cases:

**If you use Cloudflare (recommended for DNS):**
1. Cloudflare dashboard → your domain → **DNS** → **Records**
2. Click **Add record** for each
3. Set **Proxy status** to "DNS only" (gray cloud) — *not* proxied
4. Save

**If your domain is at Namecheap / GoDaddy / etc.:**
1. Log in to your registrar
2. Domain settings → DNS records / Advanced DNS
3. Add each record with the host, type, and value from Resend

DNS propagates in 5–30 minutes (usually fast).

### 3.3  Verify

1. Back in Resend → click **Verify DNS Records**
2. Once all three are green ✅, the domain is verified

### 3.4  Update `.env.local`

```env
RESEND_FROM_EMAIL=hello@ayuvam.com
RESEND_FROM_NAME=Ayuvam
```

Restart the dev server. Now share invites send from `Ayuvam <hello@ayuvam.com>` to any address.

---

## 4. Payments — what works for an Indian founder

Stripe in India has restrictions and is painful. Your better options:

### Option A — **LemonSqueezy** ⭐ *(recommended)*

**Why this is right for Ayuvam:**
- Merchant of Record — they sell to your customers, you sell to them. They handle all tax (VAT, sales tax, GST).
- You don't need a US entity, EU VAT registration, or international tax compliance.
- They pay you in USD to your Indian bank (or Wise).
- Subscription billing, free trials, coupons all built-in.
- Webhook integration is clean — works great with Next.js.
- Fees: 5% + $0.50 per transaction (higher than Stripe, but you save dozens of hours of tax work).

**Cons:** higher fees than Stripe Subscription. Some customers might prefer Stripe Checkout aesthetics.

**Setup time:** ~30 minutes to register, ~1 hour to integrate.

### Option B — **Razorpay**

**Use this if:** your customers are mostly Indian businesses.

- India-native, accepts UPI, India bank cards, Indian rupees easily.
- Supports international cards too, but settles in INR.
- Subscription billing supported.
- Razorpay handles GST.
- Fees: 2% domestic, ~3% international.

**Cons:** less smooth for global audience. International customers see "Razorpay" branding (less trusted in US/EU than Stripe). FX rates may not be best.

### Option C — **Paddle**

**Use this if:** you want a Merchant of Record alternative to LemonSqueezy.

- Same MoR model as LemonSqueezy.
- More enterprise-focused. Steeper docs.
- Lower fees on high volume (5% drops at scale).

**Cons:** historically slower approval process for new merchants. Not as indie-friendly.

### My recommendation

**Go with LemonSqueezy.** Your target market is global creative agencies. LemonSqueezy is the best fit for:
- Indian founder selling globally
- Indie SaaS scale ($0–$50K MRR)
- Solo developer who wants to avoid tax/compliance work

When you're ready, sign up at **https://lemonsqueezy.com**. The integration plan:

```
1. Create products in LemonSqueezy dashboard
   - Solo: $12/mo
   - Studio: $29/mo
   - Agency: $79/mo
2. Build /api/billing/checkout — calls LemonSqueezy Checkout API
3. Build /api/billing/webhook — handles subscription events
4. Add `plan` + `lsCustomerId` + `lsSubscriptionId` to users table
5. Enforce plan limits in API routes
```

I'll implement all of this in a future session. Tell me **"LemonSqueezy is ready"** when you have an account and API key.

---

## 5. Deployment — get Ayuvam online

When you're ready to put this on the public internet (it's only on localhost right now):

### 5.1  Vercel deploy

1. Push the repo to GitHub
2. Go to **https://vercel.com/new**
3. Import the repo
4. Add the environment variables (Vercel will let you paste your whole `.env.local`):
   ```
   DATABASE_URL
   AUTH_SECRET
   NEXTAUTH_URL          ← change to https://ayuvam.com
   RESEND_API_KEY
   RESEND_FROM_EMAIL
   RESEND_FROM_NAME
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   BLOB_READ_WRITE_TOKEN  ← optional, for file uploads
   ```
5. Deploy

### 5.2  Point ayuvam.com at Vercel

1. Vercel dashboard → your project → **Settings** → **Domains**
2. Add `ayuvam.com`
3. Vercel gives you DNS records
4. Add them at your registrar / Cloudflare

### 5.3  Enable Vercel Blob (file uploads)

1. Vercel dashboard → **Storage** → **Create** → **Blob**
2. Copy the `BLOB_READ_WRITE_TOKEN`
3. Add it to your Vercel env vars

### 5.4  Update Google OAuth

Back in **Google Cloud Console → Credentials → your OAuth client**:
- Add `https://ayuvam.com` to **Authorized JavaScript origins**
- Add `https://ayuvam.com/api/auth/callback/google` to **Authorized redirect URIs**
- Save

---

## 6. What's the current state of the app?

**Working:**
- ✅ Marketing landing page at `/`
- ✅ Sign in / sign up with Google OAuth
- ✅ Sign in with email + password (admin-created users)
- ✅ Self-service workspace creation
- ✅ First-time onboarding (`/onboard`) for new users
- ✅ Workspace UI — folders, items, search, tags, history
- ✅ Magic link client access (`/share/[token]`) — view-only, no signup
- ✅ Email invitations via Resend
- ✅ Admin panel (`/admin`) for system administration
- ✅ Multi-workspace support — one user can manage many client workspaces

**Coming next:**
- ⏳ Item editing (currently you can add/delete but not edit)
- ⏳ Folder renaming
- ⏳ Mobile responsive pass
- ⏳ Payment integration (LemonSqueezy)
- ⏳ Plan limits enforcement
- ⏳ Account settings page (change name/password)

---

## 7. Quick test plan — does it all work?

After Google OAuth is set up, run through this in a fresh incognito window:

1. **Visit** `http://localhost:3000` → see the landing page
2. **Click** "Start free" → land on `/login`
3. **Click** "Continue with Google" → sign in with your Gmail
4. **Land on** `/onboard` → name your first workspace: `Test Studio`
5. **Click** "Create workspace" → land in the workspace
6. **Click** "New folder" → create `Proposals`
7. **Click** "Add item" → add a link (e.g. `https://canva.com`)
8. **Click** "Share with client" → create a share link (paste your own email)
9. **Check your inbox** → click the email link
10. **See** the client view: folders, items, "View only" badge, "Powered by Ayuvam" footer
11. **Try** clicking pencil/delete in the client view → they shouldn't exist (read-only enforced)

If all of that works: you have a functional SaaS. Time to start showing it to real users.

---

*Ayuvam · 2026*
