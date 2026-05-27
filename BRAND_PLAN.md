# Ayuvam — The Build Plan

*A working document. Read top to bottom once. Then come back to sections.*

---

## 0. The Strategic Bet

We are building the **least cluttered client portal on the internet**, priced for solo operators and small studios who are tired of shared Drive links.

The bet is not "more features." The bet is **taste**. Everything Linear, Vercel, Raycast, and Arc proved in 2023–2025: people pay a premium for products that feel like they were designed by humans who give a damn.

The category is real. The leaders are bloated. The window is open.

---

## 1. Reference Library

Before designing anything, study these. Spend an hour on each. Steal the patterns, not the pixels.

### Direct competitors (study their weaknesses)
- **Copilot** → `usecopilot.com` — closest competitor. Modern but cluttered. Tries to be CRM + portal + chat. Learn what to *cut*.
- **Dock** → `dock.us` — sales rooms. Beautiful animations. Pricing is high.
- **Moxo** → `moxo.com` — old enterprise feel. The "before" you're saving people from.
- **HoneyBook** → `honeybook.com` — for creatives. Note their soft, photography-heavy aesthetic.

### Aesthetic references (the look)
- **Linear** → `linear.app` — typography, dark mode, motion. The gold standard.
- **Vercel** → `vercel.com` — minimal black/white, sharp grid, confident copy.
- **Raycast** → `raycast.com` — pixel-perfect. Premium feel. Subtle gradients.
- **Arc** → `arc.net` — bold typography, playful copy, opinionated.
- **Fey** → `feyapp.com` — finance app. Stunning gradients, restraint.
- **Pitch** → `pitch.com` — typography-heavy SaaS marketing.
- **Resend** → `resend.com` — dev-focused, dark, orange accent.
- **Cron / Notion Calendar** → typography-driven product marketing.
- **Pylon** → `usepylon.com` — B2B, lots of whitespace, smart bento grids.
- **Mintlify** → `mintlify.com` — clean documentation feel.

### Copy & voice references
- **Stripe** docs → confident, technical, dry humor.
- **Linear** changelog → short, punchy, occasionally funny.
- **Vercel** marketing → declarative sentences. No fluff.
- **Arc** product copy → playful, opinionated, never apologetic.

### Pricing pages worth copying
- `linear.app/pricing` — the standard.
- `cal.com/pricing` — the open-source flavor.
- `vercel.com/pricing` — table-comparison done right.

---

## 2. Final Brand Decisions

These are committed. Don't relitigate.

### Name
**Ayuvam.** Pronounced *Ah-yoo-vam*. Owned. Memorable. Keep it.

### Tagline
> **Make the work look as good as it is.**

Why: agencies do excellent work. It rarely *looks* excellent when delivered through a shared Drive folder. This line names the tension and promises to fix it. It's not about file organization — it's about how your work is *perceived*. That's the emotional sale.

### One-line description (for ProductHunt, App Store, footers)
> A clean, organized space to share client work — proposals, decks, files, links — without the Drive folder chaos.

### Pronunciation note on site
A small italic line under the logo in the footer: *"Ah-yoo-vam."*

---

## 3. Visual Identity

### Color palette (committed)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0F0F0F` | Primary text, dark surfaces. Soft black, not pure black. |
| `--paper` | `#FBFAF7` | Background. Warm off-white. Not clinical. |
| `--paper-elevated` | `#FFFFFF` | Cards, modals. |
| `--line` | `#ECEAE3` | Borders, dividers. Warm. |
| `--mute` | `#7A7773` | Secondary text. Warm grey, not slate. |
| `--accent` | `#C84B31` | Single accent: deep terracotta. CTA buttons, links, focus rings. |
| `--accent-soft` | `#F4E4DC` | Accent backgrounds (pinned items, callouts). |
| `--success` | `#2A6E4F` | Confirmations only. |
| `--danger` | `#A03C2C` | Destructive actions. Stays in the warm family. |

**Why terracotta over the current indigo:** Everyone in SaaS uses indigo (Stripe, Notion, Linear, Vercel-ish). Terracotta signals creative industry, warmth, taste. It's instantly differentiated. It's also rarely used in B2B, which makes it ownable.

**Backup option** if terracotta feels too warm: `#1B4332` (deep emerald). Works for the same "premium creative" feel with a more traditional vibe.

### Typography

| Role | Font | Weight | Why |
|---|---|---|---|
| Display (hero, page titles) | **Instrument Serif** | Regular | Free. Editorial. Gorgeous. Used by tasteful brands in 2026. Gives you "magazine, not webapp." |
| Body (paragraphs, UI) | **Geist** | 400, 500 | Already in the app. Modern, readable, neutral. |
| UI labels (buttons, badges, numbers) | **Geist Mono** | 500 | Adds a "considered" feel. Like Linear/Vercel use. |

Get Instrument Serif from Google Fonts. Free. Drop it in `app/layout.tsx`.

**Critical rule:** Display serif only for headlines >24px. Below that, always Geist sans. Mixing serif at small sizes looks amateur.

### Logo direction

**Logo type:** Wordmark only. No icon mark for now.

The wordmark: **"Ayuvam"** set in Instrument Serif Italic, in `--ink`. The italic gives it editorial energy. No flourishes. No mark.

For the favicon and app icon: a square containing a lowercase **a** in Instrument Serif Italic, on `--accent` (terracotta). Cropped tight. That's the entire logo system.

This is the Vercel/Arc/Pitch playbook: when your typography is good enough, you don't need a mark.

**Prompt for designer or AI (only if needed):**
```
Wordmark logo for "Ayuvam". Single word in serif italic 
typeface (similar to Instrument Serif or PP Editorial). 
Color: soft black #0F0F0F on warm cream background #FBFAF7. 
No icon, no decoration, no underline. Editorial magazine 
aesthetic. Vector, transparent SVG. Letterforms slightly 
tighter than default tracking.
```

### Voice & tone rules

**Always:**
- Short sentences.
- Active voice.
- Specific nouns.
- Confidence without bravado.

**Never:**
- "Effortless", "seamless", "streamline", "leverage", "robust", "next-gen", "AI-powered" (we don't have AI, don't lie).
- Exclamation marks (one per page maximum, in the success state).
- Emoji in product copy.
- Phrases like "we believe", "we're on a mission".

**Examples:**

❌ "Streamline your client communications with our powerful workspace solution."
✅ "Send one link. Skip the email thread."

❌ "Leverage best-in-class organization to elevate your client experience."
✅ "A folder structure your clients can actually follow."

❌ "Our intuitive interface makes file sharing effortless!"
✅ "Drop files in. Send the link. Done."

---

## 4. The Landing Page

One page. Long scroll. Built in your existing Next.js repo as `app/(marketing)/page.tsx`.

### Section-by-section blueprint

```
┌──────────────────────────────────────────────────────────────┐
│ [0] Sticky nav — frosted glass, 64px tall                     │
│     Ayuvam (logo)          Features  Pricing  Log in  Start → │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [1] HERO                                                       │
│                                                                │
│     Make the work look                                        │
│     as good as it is.        ← display serif, 80px, italic    │
│                                                                │
│     A clean, organized space to share client work —          │
│     proposals, decks, files, links — without the              │
│     Drive folder chaos.                                       │
│                                                                │
│     [Start free →]   [See it in action]                      │
│                                                                │
│     ┌──────────────────────────────────────────┐            │
│     │   [Real app screenshot, browser frame,    │            │
│     │    soft shadow, slight rotation —         │            │
│     │    inspired by linear.app hero]           │            │
│     └──────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
                  Reference: linear.app, fey app

┌──────────────────────────────────────────────────────────────┐
│ [2] LOGO STRIP — "Used by teams at"                           │
│     [client logos in grayscale, even if just 5 friends' cos] │
└──────────────────────────────────────────────────────────────┘
                  Reference: vercel.com

┌──────────────────────────────────────────────────────────────┐
│ [3] THE BEFORE / AFTER                                        │
│                                                                │
│     "Your client work, right now."     ← serif italic, 48px   │
│                                                                │
│     Three columns of pain:                                    │
│     ┌────────┐ ┌────────┐ ┌────────┐                         │
│     │ Slack  │ │ Drive  │ │ Email  │                         │
│     │ scrol- │ │ folder │ │ thread │                         │
│     │ ling   │ │ chaos  │ │ hunt   │                         │
│     └────────┘ └────────┘ └────────┘                         │
│                                                                │
│     [Visual line break]                                       │
│                                                                │
│     "Your client work, on Ayuvam."                            │
│                                                                │
│     Large screenshot of a clean workspace.                    │
└──────────────────────────────────────────────────────────────┘
                  Reference: usecopilot.com homepage flow

┌──────────────────────────────────────────────────────────────┐
│ [4] BENTO FEATURE GRID                                        │
│                                                                │
│     "Three things, done properly."  ← serif italic            │
│                                                                │
│     ┌─────────────────────┐ ┌───────────────────┐            │
│     │ Big tile (2 cols)   │ │ Small tile         │            │
│     │ One workspace       │ │ Magic link access  │            │
│     │ per client          │ │ for clients        │            │
│     │ [animated viz]      │ │                    │            │
│     └─────────────────────┘ └───────────────────┘            │
│     ┌──────────┐ ┌────────────────────────────────┐          │
│     │ Tags &   │ │ Big tile                        │          │
│     │ search   │ │ Duplicate link detection        │          │
│     │          │ │ [demo]                          │          │
│     └──────────┘ └────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
                  Reference: apple.com/iphone, pylon.com, linear.app

┌──────────────────────────────────────────────────────────────┐
│ [5] HOW IT WORKS — 3 STEPS                                    │
│                                                                │
│     "Set up in five minutes."                                 │
│                                                                │
│     01  Create a workspace per client                         │
│         [small screenshot]                                    │
│                                                                │
│     02  Drop in proposals, files, and links                  │
│         [small screenshot]                                    │
│                                                                │
│     03  Send the link. Your client sees only their work.    │
│         [small screenshot]                                    │
└──────────────────────────────────────────────────────────────┘
                  Reference: cal.com homepage

┌──────────────────────────────────────────────────────────────┐
│ [6] TESTIMONIAL — ONE BIG QUOTE                              │
│                                                                │
│     "I stopped getting 'where's the file?' messages            │
│      the same week I started using Ayuvam."                  │
│                                                                │
│     — [Name], Founder, [Agency]                              │
│                                                                │
│     (Even one real quote. Get it from a beta user.)          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [7] PRICING                                                    │
│                                                                │
│     Three cards. Monthly/Annual toggle (top).                 │
│     Annual saves 2 months — show "Save 17%" tag.             │
└──────────────────────────────────────────────────────────────┘
                  Reference: linear.app/pricing, vercel.com/pricing

┌──────────────────────────────────────────────────────────────┐
│ [8] FAQ — accordion, 5 questions                              │
│     - How is this different from Google Drive?               │
│     - Do my clients need to sign up?                          │
│     - Can I cancel anytime?                                   │
│     - Is my data secure?                                      │
│     - What's the file size limit?                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [9] FINAL CTA — full-width band                              │
│                                                                │
│     "Stop sending Drive links."                              │
│     [Start free — no credit card →]                          │
└──────────────────────────────────────────────────────────────┘
                  Reference: stripe.com final CTAs

┌──────────────────────────────────────────────────────────────┐
│ [10] FOOTER                                                    │
│      Logo · *Ah-yoo-vam* · Twitter · Status · Privacy · 2026  │
└──────────────────────────────────────────────────────────────┘
```

### Hero copy — committed final version

```
Make the work look 
as good as it is.

Ayuvam gives every client their own clean space for 
proposals, decks, files, and links. Organized by you. 
Beautiful for them.

[Start free →]   [See it in action]
```

### Micro-interactions to include

These are what separate "dull" from "modern":

- **Cursor:** Custom small dot cursor on the marketing site, like `arc.net`.
- **Scroll-triggered fade-in:** Sections fade up 8px on scroll-into-view. Use `framer-motion` or CSS `@starting-style`.
- **Nav blur:** Sticky nav uses `backdrop-blur-md` over a semi-transparent paper background.
- **Hover on bento tiles:** Subtle scale `1.01`, border darkens. Like Linear.
- **CTA button:** Terracotta with a subtle inner highlight. Hover: scales 1.02, shadow grows.
- **Hero screenshot:** Floats with `transform: rotate(-1deg)` and parallax on scroll. Like Fey.
- **Loading the page:** Hero serif text fades in word by word over 600ms.

### Tech stack for the landing page

Build it in the existing Next.js repo:
```
app/(marketing)/
  layout.tsx          → marketing-specific layout (different from app)
  page.tsx            → home
  pricing/page.tsx    → pricing
  about/page.tsx      → about (later)
```

Dependencies to add:
```
framer-motion       → scroll animations, hover micros
@vercel/og          → dynamic OG images for sharing
```

Use `next/font/google` to load Instrument Serif. Add the Geist font for `--font-sans` (already there).

---

## 5. The App — Modern Redesign

### Critical decisions

**Light mode primary.** Dark mode later. Reason: clients viewing the portal are not all developers. Light is friendlier. (Linear is dark because it's for engineers. Notion is light because it's for everyone.)

**Replace indigo with terracotta across the entire app.** Find/replace:
- `indigo-50` → `accent-soft` (`#F4E4DC`)
- `indigo-500/600/700` → `accent` (`#C84B31`)
- `bg-[#fafafa]` → `bg-paper` (`#FBFAF7`)
- `border-[#ebebeb]` → `border-line` (`#ECEAE3`)

This single change will make the app feel 60% more "considered" immediately.

### Modern patterns to add

These are the small things that make an app feel 2026, not 2022:

| Pattern | Where | Reference |
|---|---|---|
| Command bar (⌘K) | Anywhere — opens search + quick actions | Linear, Raycast, Vercel |
| Subtle motion on every state change | Folder selection, modal open, item add | Linear |
| Empty states with one specific action | "No items yet" → big terracotta button | Notion, Pitch |
| Toast notifications, top-right | Save confirmations, errors | Linear (uses Sonner) |
| Keyboard shortcuts hint at bottom of search | "Press ⏎ to open · ⌘+K to search" | Linear |
| Sidebar collapse button | Hide sidebar for focus mode | VS Code, Linear |
| Inline editing on hover | Click a title, edit in place. No modal. | Notion, Linear |
| Skeleton loaders (you have these ✓) | Already done | — |
| Sonner toasts library | Install `sonner` | `sonner.emilkowal.ski` |
| `cmdk` for command bar | Install `cmdk` | `cmdk.paco.me` |

### Top-bar redesign

Current top bar is functional but plain. Make it like Linear:
- 48px tall (shorter than current 56px)
- Logo + workspace switcher on the far left, looks like a breadcrumb
- Search bar in the center, with `⌘K` hint on the right of the bar
- User avatar circle on the far right with dropdown (settings, billing, sign out)
- Subtle bottom border, no shadow

### Sidebar redesign

Current sidebar works. Polish:
- 240px wide (slightly wider than 224)
- "All items" link at top with a small folder icon
- "Pinned" section showing pinned items (collapsible)
- Folder tree below
- Bottom of sidebar: workspace switcher pill if user is in multiple
- New: a small "Invite client" button at the bottom of the sidebar — bright terracotta, hard to miss

### Item list redesign

Currently a card grid (good) and a table view (good). Add:
- **View toggle** in the header: `□ List  · ▦ Grid  · ⊞ Gallery`
- **Sort dropdown:** Newest, Oldest, A–Z, By type
- **Filter chips** under the header for tags: clicking a tag filters
- **Inline rename** on double-click of title
- **Bulk select** with checkbox on hover, then a floating action bar at the bottom (delete, move, tag)

### Item detail panel

Currently expanding the item card shows history inline. Replace with a **right-side detail panel** that slides in:
- 400px wide, full height
- Shows: full title (editable), URL, all tags, full notes, full history timeline
- Like Linear's issue detail panel
- Close with `Esc`

### Empty states — committed copy

Don't just say "Nothing here." Every empty state needs one specific action.

| Where | Headline | Subtext | Button |
|---|---|---|---|
| No workspaces | "Create your first workspace." | "Workspaces are spaces per client. Start with one." | "Create workspace" |
| Empty folder | "This folder is quiet." | "Drop in your first link, file, or proposal." | "Add item" |
| No search results | "Nothing matched '[query]'." | "Try a different keyword or a tag." | "Clear search" |
| No clients invited | "Your work is private." | "Invite a client to share this workspace." | "Invite client" |

### Toast messages — committed copy

Install `sonner`. Use these copies:
- Item saved → "Saved."
- Item deleted → "Deleted. [Undo]"
- File too large → "File too big. Limit is 20MB."
- Client invited → "Invite sent to [email]."
- Duplicate link → "This link already lives in [folder]." with a link.

Short. Lowercase. Period at the end. Like Linear.

---

## 6. Onboarding Flow

The first 90 seconds decide if someone stays.

### The flow

```
Step 1 — Welcome (after signup)
  H1:   "Welcome to Ayuvam."
  Sub:  "Three quick steps. About 60 seconds."
  [Continue]

Step 2 — Name your studio
  Input: "What's your studio or agency called?"
  Placeholder: "e.g. Carbelim"
  This becomes their root account name.
  [Continue]

Step 3 — Create first client workspace
  Input: "Name a client you work with."
  Placeholder: "e.g. Acme Inc"
  This creates their first workspace.
  Below: small text "Don't worry — you can rename later."
  [Continue]

Step 4 — Add something
  Pre-filled item: 
    Title: "Welcome to your workspace"
    Type: Link
    URL: ayuvam.app/welcome (or any sample link)
    Tags: getting-started
  
  H1: "Drop in your first item."
  User edits/saves.
  [Save & continue]

Step 5 — Invite (optional)
  H1: "Want your client to see this?"
  Sub: "Send them a magic link. No account needed."
  Input: client email (skippable)
  [Send invite]  [Skip — I'll do this later]

Step 6 — Done
  H1: "You're set."
  Sub: "Add more workspaces anytime. Press ⌘K to search."
  [Open my workspace →]
```

### Why this works

- Five clicks. ~60 seconds.
- Every step delivers value (named studio, named client, real item, real invite).
- The "Welcome to your workspace" item becomes a self-referential tutorial — clicking it explains the product.
- Inviting a client during onboarding starts the viral loop (client clicks link → sees Ayuvam → maybe signs up).

### Empty states post-onboarding

After onboarding, the user lands on their workspace. The folder is empty. Show:

```
┌────────────────────────────────────────┐
│                                          │
│         [small terracotta icon]          │
│                                          │
│      One item down. Keep going.          │
│                                          │
│   Add more proposals, decks, or links.   │
│   Use tags to find them later.           │
│                                          │
│         [+ Add item]                     │
│                                          │
└────────────────────────────────────────┘
```

---

## 7. Pricing — Committed

### The plans

| | **Free** | **Solo** | **Studio** | **Agency** |
|---|---|---|---|---|
| Price (monthly) | $0 | $12 | $29 | $79 |
| Price (annual) | $0 | $120 | $290 | $790 |
| Client workspaces | 1 | 5 | Unlimited | Unlimited |
| Folders & items | 25 items | Unlimited | Unlimited | Unlimited |
| Team members | 1 | 3 | 10 | Unlimited |
| Storage | 100MB | 2GB | 10GB | 50GB |
| Client magic links | ✓ | ✓ | ✓ | ✓ |
| Tags & search | ✓ | ✓ | ✓ | ✓ |
| Duplicate detection | ✓ | ✓ | ✓ | ✓ |
| Custom subdomain | — | — | — | ✓ |
| White label (remove Ayuvam brand) | — | — | — | ✓ |
| Priority support | — | — | — | ✓ |
| "Powered by Ayuvam" badge on client view | shown | shown | shown | hidden |

### The pricing page itself

Three cards. The middle one (**Studio**) is highlighted with a terracotta border and a small "Most popular" tag.

Below the cards: feature comparison table (full width), like `linear.app/pricing` or `vercel.com/pricing`.

At the bottom: FAQ about pricing specifically (refunds, cancellation, downgrading).

### The "Powered by Ayuvam" play

On Free, Solo, and Studio plans, the client-facing workspace shows a small `Powered by Ayuvam` text in the footer. Hidden on Agency. This is your free distribution. Every shared workspace = a billboard.

---

## 8. Payment — Stripe Setup

### What to build

```
1. Stripe Dashboard
   - Create 3 Products: Solo, Studio, Agency
   - Create 2 Prices per product: monthly, annual
   - Note Price IDs for each

2. Database schema additions
   users.plan              enum (free, solo, studio, agency)
   users.stripeCustomerId  text
   users.stripeSubscriptionId text
   users.planRenewsAt      timestamp

3. API routes
   POST /api/billing/checkout  → creates Checkout session
   POST /api/billing/portal    → opens Stripe Customer Portal
   POST /api/billing/webhook   → handles subscription events

4. Webhooks to handle
   checkout.session.completed       → set plan in DB
   customer.subscription.updated    → update plan/renewal
   customer.subscription.deleted    → downgrade to free

5. Plan enforcement
   Add `checkPlanLimit(userId, resource)` helper.
   Call in routes that create workspaces, members, uploads.
   Return 402 Payment Required with upgrade URL on limit.

6. UI
   - Billing page at /settings/billing
   - Shows current plan, renewal date, upgrade/downgrade buttons
   - "Upgrade to Studio" modal triggered on limit hit
```

### What to use
- `stripe` npm package
- `@stripe/stripe-js` for the Checkout redirect
- A simple webhook handler at `/api/billing/webhook` that verifies signature

### Don't build (yet)
- Usage-based billing
- Coupons / discount codes (use Stripe's built-in promotion codes)
- Custom invoices
- Tax handling (Stripe Tax handles it)

---

## 9. Marketing — The Playbook

You have no budget. Your job is to be the most specific person talking about one specific problem.

### The five channels (ranked)

**1. Twitter/X — build in public**

Post daily. Three buckets:
- **Build updates** (40%): screenshots of new features, lessons learned, behind-the-scenes.
- **Problem posts** (30%): observations about agency life, file chaos, client comms.
- **Opinions** (30%): hot takes on design tools, agency operations, SaaS pricing.

Template post:
> "Spent 3 hours today building magic link invites for Ayuvam. Watching a client click a link and land in their workspace without signing up — feels like the product just clicked. Building agency tools is mostly about removing steps. [screenshot]"

Reply to 20 people per day in your niche. Agency owners, freelancers, designers.

**2. LinkedIn — long-form for buyers**

Post 2x per week. Agency owners and consultants live on LinkedIn. Longer, more story-driven than Twitter.

Template:
> "We were losing 30 minutes a week looking for the right client file.
> 
> Not exaggerating. Slack scrolling. Drive searching. Email digging.
> 
> So I built Ayuvam. One workspace per client. Everything we deliver, in one place. Clients see a clean view — no Drive folders to navigate.
> 
> Two weeks in, here's what I've learned about building tools for agencies: [3 lessons]
> 
> If you run a studio or agency and want to try it free, comment 'portal' and I'll send a link."

**3. Cold outreach — fastest path to first 20 paying customers**

Find freelancers and small agency owners on LinkedIn. Send 20 messages per day.

Template:
> "Hey [Name] — saw you run [studio/agency]. I built a small client portal tool for studios like yours. Think: one clean space per client, drop in your proposals/decks/links, send them a link, done. No Drive chaos.
> 
> 100% free for you. Just want 10 minutes of feedback. Worth a quick look?"

Expect 10–15% response. 2–3 conversations per day. After 3 weeks, you have 30+ real users.

**4. ProductHunt launch — when you're ready**

Launch criteria (all must be true):
- Magic link client access shipped
- Email invites shipped
- Stripe live
- Onboarding flow tight
- 20+ active users
- 5+ user testimonials you can quote

Launch playbook:
- Schedule for Tuesday, 12:01am PT
- Coordinate with 20 users to upvote + comment in first 2 hours
- Make a 90-second screen recording (use `screen.studio` for polish)
- Post the same day on Twitter, LinkedIn, IndieHackers
- Reply to every PH comment within 30 minutes

**5. SEO — month 3 onwards**

Write one article per week. Long-tail, problem-aware queries:
- "Best client portal software for design agencies 2026"
- "How to organize client deliverables as a freelancer"
- "Google Drive alternatives for client file sharing"
- "What to include in a client handover folder"
- "How to look more professional to clients (as a freelancer)"

Each article is 1,500–2,500 words. Include screenshots of Ayuvam. Soft CTA at the end. Don't optimize for keyword stuffing — write the *best* article on the topic.

### Distribution checklist (week of every release)

- Post a Twitter thread about the new feature
- Post a LinkedIn long-form about the problem it solves
- Update changelog at `/changelog`
- Email existing users (use Resend or Loops)
- Reply to people who tweeted about the problem this feature solves

---

## 10. The Timeline

### Month 1 — Foundation

**Week 1 — Brand & landing**
- [ ] Decide on terracotta vs emerald (pick terracotta)
- [ ] Add Instrument Serif via Google Fonts in `app/layout.tsx`
- [ ] Build `app/(marketing)/page.tsx` with hero + nav
- [ ] Write final hero copy + meta tags + OG image
- [ ] Deploy. Tweet the URL. Collect emails (Resend signup form).

**Week 2 — App color refresh + onboarding**
- [ ] Replace all indigo with terracotta throughout the app
- [ ] Add Instrument Serif to display headings in the app
- [ ] Build 5-step onboarding flow
- [ ] Install `sonner` for toasts
- [ ] Replace alerts and confirms with `sonner` toasts + a confirm dialog

**Week 3 — Critical missing features**
- [ ] Magic link client access (no signup needed)
- [ ] Email invitations via Resend
- [ ] Item editing
- [ ] Folder rename
- [ ] Account settings page

**Week 4 — Stripe + plans**
- [ ] Stripe products & prices
- [ ] Checkout + portal + webhook routes
- [ ] Plan limits in API
- [ ] Billing page
- [ ] Upgrade modals

### Month 2 — Polish & launch

**Week 5 — Polish**
- [ ] Command bar (⌘K) with `cmdk`
- [ ] Right-side item detail panel
- [ ] View toggle (list/grid)
- [ ] Mobile responsive pass
- [ ] "Powered by Ayuvam" on client view

**Week 6 — Pre-launch**
- [ ] First 10 cold-outreach users
- [ ] Get 3 testimonials
- [ ] Build pricing page
- [ ] Build FAQ + changelog
- [ ] Make ProductHunt screen recording

**Week 7 — Launch**
- [ ] ProductHunt Tuesday
- [ ] IndieHackers post
- [ ] Twitter + LinkedIn coordination
- [ ] Reply to everything for 48 hours straight

**Week 8 — Iterate**
- [ ] Talk to every signup
- [ ] Fix the top 3 confusion points
- [ ] First paying customers
- [ ] Plan content calendar for month 3

### Month 3 — Growth

- Custom subdomains
- Activity feed
- White label for Agency plan
- Weekly SEO articles
- Double down on whatever channel converted best

---

## 11. The First Five Things to Do This Week

If you only do five things from this doc, do these:

1. **Pick the accent color today.** Terracotta `#C84B31` or emerald `#1B4332`. Commit, change the CSS variables, move on.
2. **Add Instrument Serif** via Google Fonts. Use it on the workspace name header and the empty states. See how it feels.
3. **Build the marketing route** — `app/(marketing)/page.tsx` — with just the hero section. Deploy it. Get the brand reality-check.
4. **Write one Twitter post about Ayuvam** — share the landing page. Start the build-in-public clock.
5. **Cold-email five agency owners** with the template above. The fastest way to know if the product matters is to hear someone say "yes, I want this."

Everything else can wait a week.

---

## 12. What This Doc Is Not

This is a plan, not a contract. If a user tells you something this doc didn't predict, follow the user. If terracotta feels wrong when you see it on screen, change it. If the hero copy doesn't land in user testing, rewrite it. Speed and feedback beat strategy every time.

The only thing in this doc that's non-negotiable: **simplicity is the product**. Every time you're tempted to add a feature, ask: *Does this make Ayuvam simpler, or busier?* If busier, don't ship it.

---

*Ayuvam — Ah-yoo-vam — 2026.*
