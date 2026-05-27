# About Ayuvam

*A single document describing what this product is, who it's for, how it works, and what it stands for. Share this with collaborators, freeze it for your About page, or use it as the brief for a designer.*

---

## What Ayuvam is

**Ayuvam is a client deliverables portal for studios, agencies, and freelancers.**

Most creative work — proposals, decks, design files, Canva links, Figma boards, PDFs, contracts — ends up scattered across Slack threads, Google Drive folders, and email attachments. Clients have to dig through messy shared drives to find anything. Studios look disorganized even when the work is excellent.

Ayuvam fixes that with one specific shape:

> Each client gets their own workspace. The studio organizes everything inside. The client gets one clean link to view it — no account, no password, no friction.

It's not a CRM. Not invoicing. Not project management. Not Notion. It does one thing: **present your client work, properly.**

---

## The line

> **Make the work look as good as it is.**

Why this and not something else: studios already make excellent work. The work just rarely *looks* excellent at the moment of delivery — it looks like a Drive link in a Slack message. Ayuvam doesn't change the work. It changes how the work is perceived. That's the emotional sale.

**Pronounced:** *Ah-yoo-vam.*

---

## Who it's for

The buyer is one of these:

- A solo freelancer juggling 3–8 client projects at once
- A small design studio (2–10 people) delivering work to ongoing clients
- A marketing or branding consultancy with retainer relationships
- An agency owner who's tired of "Hey, where's that file?" messages
- A founder who wants to look more professional to her clients

The user is the same person + their small team. The audience is their clients.

---

## What's inside

Three things, only three. The product's discipline is what it refuses to add.

### 1. One workspace per client
Each workspace is private and isolated. Acme Studio's workspace shows Acme's work — nothing about Northwind or Olive. A studio can manage as many workspaces as they have clients.

### 2. Organized content
Inside each workspace: folders (nested infinitely), and items (links or files up to 20MB). Every item has tags, notes, a date, and an optional history of updates. Search is instant. Drop a link that already exists somewhere in the workspace and Ayuvam flags the duplicate.

### 3. Beautiful client access
The studio creates a "share link" — a long unguessable URL. The client clicks it. No login screen, no password, no signup. They land in a clean, read-only view of their workspace with no edit controls. The studio can revoke any link at any time.

That's the entire product.

---

## How it's meant to be used

A typical day:

```
Studio wraps a deliverable
   ↓
Studio drops the file or link in the right folder of the client's workspace
   ↓
(First time only) Studio clicks "Share with client" → enters the client's email
   ↓
Client receives a branded email: "Ayuvam — [Studio] shared a workspace with you"
   ↓
Client clicks "Open the workspace →"
   ↓
Client sees a clean list of everything the studio has delivered
   ↓
Next time, no email needed — client bookmarks the link
```

The product becomes daily-use only for the studio. For the client, it becomes the trusted place to look when they need to find something delivered.

---

## Brand identity

### Visual

**Color palette:**

| Token | Hex | Use |
|---|---|---|
| Ink | `#0F0F0F` | Primary text, deep surfaces |
| Paper | `#FBFAF7` | Background — warm off-white |
| Paper elevated | `#FFFFFF` | Cards, modals |
| Line | `#ECEAD9` | Borders, dividers |
| Mute | `#7A7773` | Secondary text |
| Accent | `#C84B31` | CTAs, focus, brand moments — terracotta |
| Accent soft | `#F4E4DC` | Pinned states, callouts |

**Typography:**

- **Display:** [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) (free, Google Fonts) — italic style for emotional emphasis
- **UI text:** [Geist Sans](https://vercel.com/font) (already loaded)
- **Numerals, tags, system labels:** Geist Mono

**Logo:** Just the word `Ayuvam` set in Instrument Serif italic. No icon mark. The typography *is* the logo.

### Voice

How Ayuvam writes — in product, in emails, on the landing page, in support messages.

**Always:**
- Short sentences
- Active voice
- Concrete nouns over abstract concepts
- Confidence without bravado

**Never:**
- "Effortless", "seamless", "streamline", "leverage", "robust"
- Exclamation marks (one per page maximum)
- AI-isms ("we're on a mission", "we believe", "we're so excited")
- Long paragraphs when one line does the job

### Examples

| Bad | Good |
|---|---|
| "Streamline your client communications" | "Send one link. Skip the email thread." |
| "Effortlessly organize your files" | "Drop files in. Send the link. Done." |
| "We're so excited to share..." | "New: magic link client access." |
| "Powerful, intuitive workspace" | "A folder structure your clients can follow." |

---

## Plans & pricing

| | **Free** | **Solo** | **Studio** | **Agency** |
|---|---|---|---|---|
| Price (monthly) | $0 | $12 | $29 | $79 |
| Annual (per month) | $0 | $10 | $24 | $66 |
| Client workspaces | 1 | 5 | Unlimited | Unlimited |
| Items | 25 | Unlimited | Unlimited | Unlimited |
| Team members | 1 | 3 | 10 | Unlimited |
| Storage | 100MB | 2GB | 10GB | 50GB |
| Magic link access | ✓ | ✓ | ✓ | ✓ |
| Custom subdomain | — | — | — | ✓ |
| Remove "Powered by Ayuvam" | — | — | — | ✓ |

Pricing rationale: Free gives every user a path to feel the product. Solo is an easy yes for a freelancer billing $1,000+ a month. Studio is the money tier and the default recommendation. Agency is for the agencies that want to white-label.

---

## How a new user signs up

1. Lands on `ayuvam.com` → sees the landing page
2. Clicks **Start free** → goes to `/login`
3. Clicks **Continue with Google** → approves the consent screen
4. (First time only) lands on `/onboard` → names their first workspace ("Acme Inc" or their studio name)
5. Clicks **Create workspace** → lands in the workspace
6. From there: creates folders, drops in items, shares with their first client

Total time from landing page to first shared client view: about 60 seconds.

---

## What makes Ayuvam different

The market has client portal tools. Many of them. Here's how Ayuvam is different:

| Competitor | What they do | Where Ayuvam wins |
|---|---|---|
| **Copilot** ($39-99/mo) | Full client portal with messaging, billing, files | Cleaner UI, much cheaper, no bloat |
| **HoneyBook** ($16-39/mo) | CRM for creatives — contracts, invoices, portal | Ayuvam focuses on delivery, not contracts |
| **Notion** | General-purpose knowledge | Client view requires no Notion account; UI is purpose-built |
| **Google Drive** | File storage | Drive shows file types; Ayuvam shows your *work* |
| **Moxo / SuiteDash** | Enterprise client portals | Designed for one person, not 50; modern UI |

**Ayuvam's edge: radical simplicity at a price anyone can say yes to.**

---

## The tech under it

For collaborators, designers, or whoever asks "what's it built with":

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Neon (Postgres, serverless) |
| ORM | Drizzle |
| Auth | NextAuth v5 — Google OAuth + email/password |
| Email | Resend |
| File storage | Vercel Blob |
| Payments (planned) | LemonSqueezy (Merchant of Record) |
| Hosting | Vercel |
| Styling | Tailwind CSS v4, custom CSS tokens |
| Type system | TypeScript |

The whole product runs in one Next.js codebase (route groups separate `marketing` / `app` / `share` / `admin` surfaces). No microservices, no separate marketing site, no CMS. One repo, one deploy.

---

## What's next

In rough order:

1. **Item editing + folder rename** — basic CRUD gaps
2. **Mobile pass** — clients view on phones
3. **LemonSqueezy** — paywall the limits we've designed
4. **Account settings page** — change name, password
5. **Activity log** — "Hitesh added a file 3 days ago"
6. **Custom subdomain** (Agency plan only) — `carbelim.ayuvam.com`
7. **White-label** (Agency plan only) — remove the Ayuvam footer

None of these are required to start showing the product to real users. They're improvements layered on a working core.

---

## How to talk about Ayuvam

If someone asks "what's that?" in 10 seconds:

> *It's a clean client portal for studios. One link per client, all the files and links you've delivered them, organized. Replaces the Drive folder mess.*

If they ask in 30 seconds:

> *Every client gets their own workspace. You drop in proposals, decks, files, links — anything. Tag them, note them. Send the client a magic link — they see only their stuff, view-only, no signup. Makes the studio look organized and the work look as good as it is.*

If they ask in 5 minutes — that's a sales call, and the landing page does the work for you.

---

## The North Star

If we ever have to decide between adding a feature and keeping the product simple, **simple wins**. Every successful tool in this category got bloated; that's why there's a market opening for Ayuvam. The discipline isn't the absence of ideas — it's the willingness to refuse them.

Ayuvam will not become a CRM. It will not become a billing tool. It will not become a messaging app. It does one thing.

> *Make the work look as good as it is.*

---

*Last updated: 2026 · Ayuvam · ayuvam.com*
