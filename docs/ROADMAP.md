# Ayuvam — Roadmap

*Where we are. What's next. What's coming. Updated as we ship.*

Last updated: **May 28, 2026**

---

## Status at a glance

| | |
|---|---|
| **Live URL** | https://ayuvam.com |
| **Hosting** | Vercel |
| **Domain** | ayuvam.com (GoDaddy, DNS via GoDaddy) |
| **Database** | Neon Postgres |
| **Stage** | **Beta-ready** — mobile pass done, CRUD complete, awaiting Paddle |
| **Paddle** | Verification submitted (24–48h review) |
| **Pricing** | $0 / $9 / $19 / $49 — Free / Solo / Studio / Agency |

---

## ✅ Shipped

### Core product
- Marketing landing page (Hero, Bento, How-it-works, Pricing, FAQ, Final CTA)
- `/pricing`, `/terms`, `/privacy`, `/refund` legal pages
- 404 not-found page (brand-aligned)
- Sign in / sign up with Google OAuth
- Sign in with email + password (for admin-created users)
- Self-service onboarding (single-step workspace creation wizard)
- Workspace UI — folders (nested, color-coded), items (links + files), search, tags, item history
- **Item edit** — inline modal with full field editing (title, URL, tags, notes, date)
- **Folder rename** — double-click name or use menu, inline edit
- **Account settings** at `/settings` — change display name, set/change password
- Add Item modal with **fixed** duplicate detection (separate `/api/workspace/items/check` endpoint, no side effects)
- **Strong search** — multi-token, date-aware (`14 May 2026`, `May`, `2026-05-14`, ISO, slash, partial)
- "All items" table view across all folders
- Pinned items surface to the top
- File uploads to Vercel Blob (20 MB cap)
- Skeleton screens for all loading states (no spinners)
- **Mobile responsive** — sidebar drawer with hamburger, folder chips on share view, table column priorities, hero mockup collapse
- **Branded toasts** (`sonner`) for save / delete / pin / copy feedback — no more silent updates
- **Promise-based confirm dialogs** — all 7 browser `confirm()` calls replaced with branded UI
- **Folder color editor** — change any folder's color via the menu, swatches in a popover
- Custom **404 page** — brand-aligned, with home + workspace CTAs
- **Register grid** — every folder is now a spreadsheet-style register (Name · Description · Status · Link · Remark · Updated). **Inline cell editing** (double-click, Enter to save), **customizable status dropdown** (per register, recolor/rename/add), **row colors**, grid dividers + sticky header. Cards view was retired — register is the single, consistent view, and it drives the client share view. Search results use the same grid.
- **Dark mode** — neutral-charcoal night theme for the app + client share view (sun/moon toggle in the top bar), scoped so marketing stays light. Built on the CSS-variable token system; status/row colors adapt.
- **Item detail panel** — click any row to open a slide-over with full editing (title, description, link, status, row color, tags, date, remark) plus the update-history timeline + "log an update" box. Double-click still edits a cell inline. Replaced the old edit modal; the add modal is now add-only with status + color pickers.
- **Type-to-confirm folder delete** — deleting a folder (which removes everything inside) now requires typing its exact name, GitHub-style.
- **Workspace settings** — rename a workspace or delete it (cascades folders/items/shares) from the workspace switcher; manager-only, delete is type-to-confirm. Slug stays stable on rename so share links don't break.
- **Smart tags** — when adding a row, one keystroke imports the tags from the folder's last item; tag autocomplete suggests existing workspace tags as you type.
- **Multiple labeled links** — each item keeps a primary link plus any number of labeled extras (Raw, Final, Source…). Editable in the detail panel, shown as a `+N` in the grid and as chips on the client view.
- **Container folders** — a folder with sub-folders becomes a navigator (shows its sub-folders, no "Add row"); items live in the leaves.
- **Drag-to-reorder** — a grip handle (⋮⋮) on each register row and each folder/sub-folder; drag to set a manual order that persists (per-folder for rows, per-parent for folders). Native drag with a live drop indicator; order flows through to the client share view.
- **Typo-tolerant search** — when an exact search finds nothing, a `pg_trgm` similarity fallback returns the closest titles/descriptions, so small misspellings still surface the right item.
- **UX refinements** — Title is the only required field when adding (link/file are optional, add them later); the item editor is now a centered, two-column modal (was a side panel); Workspace settings live behind a gear at the sidebar's bottom; "Back to workspace" from Settings returns to the workspace you were in (remembered) instead of the selector.
- **Quick-add row** — spreadsheet-style ghost row at the bottom of every register: type a title, paste a link, Enter; focus stays put for rapid entry. "Add with details…" opens the full form.
- **First-run setup** — empty workspaces show a guided 3-step panel with one-click suggested folders (Proposals, Deliverables, Designs, Contracts) instead of a blank screen.
- **Share confidence** — each share link shows a green "Viewed 2h ago" / grey "Not opened yet" status and a labeled Preview button to see exactly what the client sees.
- **Client-facing branding** — per-workspace accent color + welcome note ("Here's everything for the Q3 launch—"), set in Workspace settings, rendered on the share view.
- **Fixes & polish** — datetime inputs no longer shift by the timezone offset (UTC bug); denser-but-larger register typography (13px descriptions/remarks, roomier rows); clickable parent breadcrumb when inside a sub-folder.
- **View persistence** — a refresh keeps you in the folder you were viewing (per workspace); folder-tree dropdowns are open by default and remember manual collapses for the session.
- **Grouped "All items"** — rows are grouped under soft folder headers (color dot + name + count, sidebar order) instead of a tiny per-row folder chip, so same-named items in different folders read clearly.
- **QoL** — press "/" anywhere to jump to search, Esc clears it; stronger table-header contrast; larger view titles.
- **Link + file together** — an item can now hold both a link and an attached file (new `file_url` column; the user's link stays in `url`). Files are downloadable from the grid, the item modal, and the client view.
- **Reordered register** — columns now read Name · Description · Note (renamed from Remark) · Link · Date · Status; the same order applies to the add form, the item modal, and the client table. Row actions collapsed to copy + a ⋯ menu (open, pin, color, short link, delete) so rows breathe.
- **Feel pass** — modals get a subtle backdrop blur; dark-mode secondary text and dates lifted for clarity; roomier table rows.
- **Default-on history logging** — edits made in the item modal prompt for a history note on close (checked by default, note required); untick "Log this update" for a silent edit. Inline cell edits stay silent by design.
- **Item references** — link any item to any other (cross-folder), each with an optional note. Shown in the item modal with backlinks ("Referenced by"); clicking jumps to that item's register and a floating "← Back to …" chip returns you. New `item_references` table with cascade cleanup.
- **Item description** field — short subtitle, shown on compact cards and as the Register Description column
- **Compact item cards** — denser two-line rows, domain instead of full URL, inline tags
- **Stronger search** — now also matches description, fileName, and space-stripped tags ("data sheet" ↔ "datasheet")
- **Short links** — every item gets a `/l/<code>` short URL that redirects to its real link. Copy from the card or register row. Public `/l/[code]` route, backfilled for existing items.
- **Non-blocking duplicates** — the "link already exists" warning now offers both "Add note to existing" and "Save as a new item" (overrideDuplicate). Never a dead-end.
- **Top-bar workspace switcher** — always-on dropdown to switch between workspaces, with "+ New workspace" inline create (any user can spin up a new workspace and becomes its manager).

### Sharing — the core product promise
- Generate magic-link share URLs per workspace
- Public read-only client view at `/share/[token]` — no signup needed
- Per-share label, optional client email, last-access tracking
- Revocable any time
- Email delivery via Resend from `hello@ayuvam.com`
- Branded HTML email template (Instrument Serif, terracotta accent)

### Admin & multi-workspace
- System admin panel at `/admin` (users, companies, memberships)
- Multi-workspace support (one user, many client workspaces)
- Workspace switcher in top bar
- Self-service workspace creation from CompanySelectorShell

### Brand & polish
- Full color migration from indigo → terracotta accent
- Instrument Serif loaded for display headlines
- Geist Sans + Mono for body and labels
- Consistent CSS token system (`--ink`, `--paper`, `--accent`, etc.)
- "Powered by Ayuvam" footer on client view

### Infrastructure
- Deployed on Vercel
- Custom domain `ayuvam.com` pointed via DNS
- Resend domain verified (sends to anyone, not just test addresses)
- Google OAuth credentials configured (test-user mode pending verification)
- `db:push` workflow for schema changes (Drizzle)

### Documentation
- `docs/PRODUCT.md` — product overview
- `docs/TECHNICAL.md` — architecture & data model
- `docs/ROADMAP.md` — this file
- `docs/BRAND.md` — visual identity
- `docs/LAUNCH.md` — operational setup guide
- `docs/DEV-SETUP.md` — local dev setup

---

## 🟡 In progress

| Task | Status |
|---|---|
| Paddle merchant verification | Waiting on Paddle (24–48h SLA) |
| Google OAuth verification | Not yet submitted — still in test-user mode |

---

## 🔜 Next up (this week — pre-launch)

The product is ready for closed beta. Last items before broad outreach:

1. **Submit Google OAuth for verification** — removes the "unverified app" warning and the test-user restriction.
2. **First 5–10 beta users** — DM friendly agency owners on LinkedIn/Twitter.
3. **Watch how they use it** — iterate based on real friction, not assumptions.

---

## 🟦 After Paddle approves

Once verification is back from Paddle, this becomes the priority:

1. **Paddle products** — create Solo / Studio / Agency in Paddle dashboard.
2. **Checkout integration** — `/api/billing/checkout` calls Paddle's checkout API.
3. **Webhook handler** — `/api/billing/webhook` handles `subscription_created`, `subscription_updated`, `subscription_cancelled`.
4. **DB schema** — add `plan`, `paddleCustomerId`, `paddleSubscriptionId`, `planExpiresAt` to users.
5. **Plan enforcement** — gate workspace count, team size, storage in API routes.
6. **Upgrade modal** — when limit hit, show "Upgrade to Studio →" with a one-click checkout.
7. **Billing page** — show current plan, renewal date, "Manage billing" button (Paddle portal).

ETA after Paddle approval: **one focused session.**

---

## 🟣 Soon (month 2-ish)

Quality-of-life features that aren't blocking but matter for retention.

| Feature | Why |
|---|---|
| Command bar (⌘K) for global search | Power-user retention |
| Right-side item detail panel | Replace inline expansion with a Linear-style panel |
| Bulk select + actions | Move/delete/tag multiple items at once |
| Activity feed | "Hitesh added 3 files · 2 hours ago" |
| Sonner toasts | Replace `confirm()` and silent updates with friendly toasts |
| Folder color change UI | We support colors in schema; expose in UI |
| Custom subdomain (Agency plan) | `studio.ayuvam.com` routing |
| White label (Agency plan) | Remove "Powered by Ayuvam" footer on client view |
| Share link expiry UI | Schema supports it; expose in modal |
| Activity log per workspace | Audit trail for who did what |

---

## 🟥 Later (when there's traction)

Only build these when users ask for them.

- Image previews for image files (thumbnails in item list)
- PDF preview/inline viewer
- Per-folder share links (instead of whole workspace)
- Custom branded email templates per Agency
- API access for external integrations
- Slack / Discord notifications
- Mobile app (probably never — the web app is plenty)
- Multi-language UI

---

## ❌ Explicitly not building

These come up in client portal tools and we're refusing them.

- Built-in messaging / chat → use email or Slack
- Invoicing → use Stripe Invoicing or QuickBooks
- Contracts / e-signatures → use HelloSign or DocuSign
- Time tracking → use Toggl or Harvest
- Task management → use Linear or Notion
- CRM / pipeline → not the job
- AI features (auto-tagging, AI search) → unless and until it adds clear value, no

Ayuvam does **one thing**. Saying no to features is the product strategy.

---

## Operational follow-ups (not code)

| Task | Why |
|---|---|
| Submit Google OAuth app for verification | Removes test-user limit |
| Move DNS from GoDaddy to Cloudflare | Better DNS UI, free CDN, faster propagation |
| Set up `hello@ayuvam.com` inbox forwarding | Customers email it; right now goes nowhere |
| Set up support@ayuvam.com | Distinct from `hello@` for product-only emails |
| Twitter/X account `@ayuvamhq` | Build-in-public channel |
| LinkedIn presence | For agency-owner outreach |
| First 20 cold DMs to agency owners | Get beta users |

---

## Launch sequence (when ready)

1. ✅ Domain live, app deployed
2. ✅ Google OAuth working
3. ✅ Email delivery working from `hello@ayuvam.com`
4. ⏳ Item edit + folder rename + account settings
5. ⏳ Paddle verified + integrated
6. ⏳ 10 friendly beta users using daily for 1 week
7. ⏳ Top 3 feedback items addressed
8. ⏳ ProductHunt launch — Tuesday morning IST
9. ⏳ Twitter + LinkedIn + IndieHackers coordination
10. ⏳ Watch closely, iterate weekly

---

## How to read this doc

- ✅ = shipped and in production
- 🟡 = actively being built right now
- 🔜 = next, this week
- 🟦 = after a specific dependency
- 🟣 = month-2-ish, not urgent
- 🟥 = only build if users ask
- ❌ = deliberately not building

If you're updating this file: keep it pruned. A roadmap that lists 50 things hides what actually matters.

---

*See also:* [PRODUCT.md](PRODUCT.md) · [TECHNICAL.md](TECHNICAL.md) · [LAUNCH.md](LAUNCH.md)
