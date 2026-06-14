# Ayuvam — Technical Sheet

*Architecture, stack, data model, and key flows. For developers, designers, or anyone evaluating the build.*

---

## Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Server + client + API in one repo |
| Language | TypeScript | Type safety end-to-end |
| Database | Neon Postgres (serverless) | Generous free tier, no infra |
| ORM | Drizzle | Type-safe, lightweight, schema-as-code |
| Auth | NextAuth v5 (JWT strategy) | Google OAuth + credentials |
| Email | Resend | Branded transactional, deliverability |
| File storage | Vercel Blob | Signed URLs, integrated with Vercel |
| Payments | Paddle (Merchant of Record) | Tax compliance for Indian founder, global selling |
| Hosting | Vercel | Zero-config Next.js |
| Toasts | Sonner | Save / delete confirmations, error states |
| Confirm dialogs | Custom Promise-based wrapper over Radix Dialog | Replaces browser `confirm()` |
| Styling | Tailwind CSS v4 + custom CSS tokens | Brand consistency |
| Display font | Instrument Serif (Google Fonts) | Italic headlines for emotional anchors |
| UI font | Geist Sans / Mono | Modern, clean, technical feel |

One repository. One deploy. No microservices, no separate marketing site.

---

## High-level architecture

```
                     ┌──────────────────────────────┐
                     │       ayuvam.com (Vercel)    │
                     │                              │
   Marketing  ──→    │  /  (landing, pricing, etc.) │
                     │                              │
   App        ──→    │  /workspace/[slug] (private) │
                     │  /admin            (private) │
                     │  /onboard          (private) │
                     │                              │
   Client     ──→    │  /share/[token]    (public)  │
                     │                              │
                     │  ─────── api routes ──────── │
                     │  /api/workspace/*            │
                     │  /api/share/[token]          │
                     │  /api/auth/[...nextauth]     │
                     └──────────────┬───────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
       ┌────────────┐        ┌────────────┐        ┌────────────┐
       │   Neon     │        │  Vercel    │        │   Resend   │
       │  Postgres  │        │   Blob     │        │            │
       │  (data)    │        │  (files)   │        │  (email)   │
       └────────────┘        └────────────┘        └────────────┘

              ┌─────────────────────┴──────────────────────┐
              ▼                                            ▼
       ┌────────────┐                              ┌────────────┐
       │  Google    │                              │   Paddle   │
       │   OAuth    │                              │  (billing) │
       └────────────┘                              └────────────┘
```

---

## Repository layout

```
files-organiser/
├── app/
│   ├── (marketing)/         Public landing, pricing, terms, privacy, refund
│   │   ├── layout.tsx       Marketing chrome (nav + footer)
│   │   ├── page.tsx         Home
│   │   ├── pricing/
│   │   ├── terms/
│   │   ├── privacy/
│   │   └── refund/
│   ├── (auth)/login/        Sign-in (Google + email/password)
│   ├── (onboard)/onboard/   First-time wizard (name workspace)
│   ├── (admin)/admin/       System administration
│   ├── (workspace)/         The product UI — folders, items, sharing
│   │   └── workspace/
│   │       ├── page.tsx     Selector or auto-redirect
│   │       └── [slug]/      One workspace
│   ├── share/[token]/       Public client view (read-only)
│   ├── api/
│   │   ├── auth/            NextAuth routes
│   │   ├── workspace/       Manager APIs
│   │   ├── admin/           Platform admin APIs
│   │   └── share/[token]    Public share endpoint
│   ├── globals.css          Brand tokens (CSS variables)
│   └── layout.tsx           Root layout (fonts, metadata)
│
├── components/
│   ├── ui/                  Primitives (Button, Badge, Dialog, etc.)
│   ├── marketing/           Hero, Bento, Pricing, FAQ, ...
│   ├── workspace/           FolderTree, AllItemsTable, ItemCard, ...
│   ├── share/               ShareView (client-facing)
│   ├── admin/               AdminShell + OverviewTab, UsersTab, SubscriptionsTab, CompaniesTab
│   └── onboard/             OnboardWizard
│
├── db/
│   ├── schema.ts            Single source of truth for all tables
│   └── index.ts             Lazy Drizzle client (Proxy pattern)
│
├── lib/
│   ├── auth.ts              NextAuth config (Google + Credentials)
│   ├── email.ts             Resend wrapper + share-invite template
│   ├── shares.ts            Token generation, share URL builder
│   ├── utils.ts             cn(), slugify(), formatDate, etc.
│   └── useDebounce.ts
│
├── docs/                    You are here
├── middleware.ts            Route protection
├── drizzle.config.ts        Migration config
└── package.json
```

Route groups (`(marketing)`, `(workspace)`, etc.) don't add path segments — they organize layouts.

---

## Data model

Six tables. Single source of truth: [db/schema.ts](../db/schema.ts).

### `users`
Anyone who signs in. Self-service signup creates these via Google OAuth.

| Column | Type | Notes |
|---|---|---|
| id | text PK | uuid |
| name | varchar(255) | from Google profile or signup |
| email | varchar(255) unique | login identity |
| passwordHash | text | empty string for OAuth users |
| role | enum(admin/manager/reader) | platform-level role |
| createdAt | timestamp | |

### `companies`
A workspace. From Ayuvam's positioning: this is "a client" you organize work for.

| Column | Type | Notes |
|---|---|---|
| id | text PK | uuid |
| name | varchar(255) | display name |
| slug | varchar(255) unique | URL segment |
| createdBy | text → users.id | |
| createdAt | timestamp | |

### `companyMembers`
Many-to-many between users and companies, with a per-workspace role.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| companyId | text → companies.id | cascade delete |
| userId | text → users.id | cascade delete |
| role | enum(manager/reader) | scoped to this workspace |
| Index | (companyId, userId) | |

### `folders`
Nested folders inside a workspace.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| name | varchar(255) | |
| companyId | text → companies.id | |
| parentId | text | nullable, self-reference for nesting |
| color | enum(slate/indigo/violet/rose/amber/emerald) | |
| viewType | enum(cards/register) | "cards" = Collection, "register" = deliverables table. Default cards. |
| createdBy, createdAt | | |
| Index | (companyId) | |

### `items`
Links or files inside folders.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| title | varchar(500) | |
| description | varchar(500) | short subtitle; shown on cards + as Register "Description" column |
| shortCode | varchar(16) unique | powers the public `/l/<code>` short link; auto-generated on create |
| type | enum(link/file) | |
| url | text | for links |
| fileKey, fileName, fileSize | | for files (Vercel Blob) |
| folderId | text → folders.id | cascade delete |
| companyId | text → companies.id | cascade delete |
| tags | text[] | Postgres array |
| notes | text | |
| itemDate | timestamp | user-editable date |
| isPinned | boolean | |
| createdBy, createdAt, updatedAt | | |
| Indexes | (companyId), (folderId), (url, companyId) | |

### `itemHistory`
Append-only timeline of update notes per item.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| itemId | text → items.id | cascade delete |
| updateNote | text | "Updated pricing section" |
| createdBy, createdAt | | |

### `clientShares`
Magic-link tokens for read-only client access.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| companyId | text → companies.id | cascade delete |
| token | text unique | URL-safe random, 32 bytes |
| label | varchar(255) | manager's reference |
| clientEmail | varchar(255) | optional |
| createdBy, createdAt | | |
| expiresAt | timestamp | nullable |
| revokedAt | timestamp | null = active |
| lastAccessedAt | timestamp | analytics |
| Indexes | (token), (companyId) | |

---

## Key flows

### Sign-in (Google OAuth)

```
User clicks "Continue with Google"
   ↓
NextAuth redirects to Google
   ↓
User approves → Google returns profile
   ↓
NextAuth.jwt callback:
   - account.provider === "google"
   - Look up user by email in DB
   - If not found → INSERT new user (role=manager)
   - Attach DB id + role to JWT token
   ↓
Session created → redirect to /workspace
   ↓
/workspace checks companyMembers:
   - 0 companies → redirect to /onboard
   - 1 company → redirect to /workspace/[slug]
   - 2+ → show CompanySelectorShell
```

### Creating a workspace (onboarding)

```
/onboard wizard → user enters workspace name
   ↓
POST /api/workspace/companies { name }
   ↓
Server:
   1. Validate name
   2. Generate unique slug (slugify + dedupe)
   3. INSERT into companies
   4. INSERT into companyMembers (user as manager)
   ↓
Redirect to /workspace/[slug]
```

### Adding an item (link)

```
Manager opens AddItemModal → enters URL, title, tags, notes
   ↓
On URL blur: POST /api/workspace/items with { _checkOnly?, url }
   ↓
Server checks for duplicate URL in same company:
   - If found → return 409 with existing item info
   - If not → continue
   ↓
On submit: POST /api/workspace/items (real)
   ↓
INSERT item, optionally INSERT into itemHistory if updateNote present
   ↓
Modal shows confirmation, parent list refreshes via refreshKey
```

### Sharing with a client

```
Manager clicks "Share with client" → ShareWithClientModal opens
   ↓
Lists existing shares (GET /api/workspace/shares?slug=...)
   ↓
"New share link" → form (label, optional email)
   ↓
POST /api/workspace/shares { label, clientEmail }
   ↓
Server:
   1. Generate random 32-byte token
   2. INSERT into clientShares
   3. If clientEmail provided → call sendShareInvite() via Resend
   4. Return share + emailStatus
   ↓
Client receives branded HTML email with terracotta CTA
```

### Client opens the share link

```
Client clicks magic link → /share/[token]
   ↓
Server-side page query:
   1. Look up clientShares by token
   2. Verify not revoked, not expired
   3. Update lastAccessedAt (fire-and-forget)
   4. Load folders + items via JOIN
   ↓
Render ShareView (read-only):
   - Top bar: Ayuvam logo, workspace name, "View only" badge
   - Sidebar: folder tree (no edit controls)
   - Content: items grid (links open in new tab, files download)
   - Footer: "Powered by Ayuvam"
```

---

## Auth & access control

Three layers of enforcement, all server-side:

| Layer | Mechanism |
|---|---|
| Route access | `middleware.ts` checks session, public paths, share tokens |
| API access | Every API route calls `getCompanyAccess(userId, slug)` — single JOIN query for membership + role |
| Mutation access | Manager-only ops check `access.role !== "manager"` → 403 |
| Admin access | `/admin` page + every `/api/admin/*` route require `session.user.role === "admin"`. The role lives in the JWT, so it refreshes on next sign-in after a change. |
| Client view | `/share/[token]` is server-rendered, no editing UI exists at all |

The "no edit controls on the client view" isn't a UI choice — there's literally no way for a non-authenticated visitor to mutate anything because none of the mutation routes are reachable without a session.

---

## Environment variables

| Var | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection | Yes |
| `AUTH_SECRET` | NextAuth JWT signing | Yes |
| `NEXTAUTH_URL` | Canonical site URL | Yes |
| `GOOGLE_CLIENT_ID` | OAuth | For Google sign-in |
| `GOOGLE_CLIENT_SECRET` | OAuth | For Google sign-in |
| `RESEND_API_KEY` | Email | For share invites |
| `RESEND_FROM_EMAIL` | Sender address | Default: `hello@ayuvam.com` |
| `RESEND_FROM_NAME` | Sender name | Default: `Ayuvam` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | **Required for file uploads.** Copy from Vercel → Storage → your Blob store. If empty, uploads fail with a 400 ("Failed to retrieve the client token"). |
| `PADDLE_API_KEY` | Paddle (server) | For billing — webhook + portal |
| `PADDLE_WEBHOOK_SECRET` | Paddle | Verifies incoming webhooks |
| `NEXT_PUBLIC_PADDLE_ENV` | Paddle (client) | `sandbox` or `production` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle (client) | Opens checkout |
| `NEXT_PUBLIC_PADDLE_PRICE_*` | Paddle (client) | Price IDs per tier/cycle |

---

## Performance notes

| Optimization | Why |
|---|---|
| `getCompanyAccess` joins companies + companyMembers in 1 query (was 2) | Halves Neon round-trip latency per API call |
| Skeleton loaders match shape of real content | Smoother perceived load on Neon cold starts |
| `lib/db.ts` uses Proxy pattern for lazy DB init | Build doesn't fail when `DATABASE_URL` is missing |
| `_dynamic` query refresh keyed off a counter | One-line refresh trigger after mutations |
| Item queries `ORDER BY isPinned DESC, createdAt DESC LIMIT 500` | Pinned items always surface, hard cap prevents runaway |

---

## What's NOT here (deliberately)

- No Redis, no caching layer (Neon is fast enough)
- No queue (Resend sends synchronously, share creation tolerates ~200ms)
- No microservices (one Next.js app does everything)
- No GraphQL (REST is fine at this scale)
- No CRM, no chat, no contracts (Ayuvam does one thing)
- No analytics / tracking (privacy as a feature)

If we ever add any of these, it should be because a user request demands it — not because of architectural ambition.

---

*See also:* [PRODUCT.md](PRODUCT.md) · [ROADMAP.md](ROADMAP.md) · [LAUNCH.md](LAUNCH.md)
