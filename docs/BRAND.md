# Ayuvam — Brand Identity

*Visual language, typography, and voice. The bare minimum needed to keep everything consistent.*

---

## Tagline

> **Make the work look as good as it is.**

Pronounced *Ah-yoo-vam*.

---

## Voice

How Ayuvam writes — in product, emails, the landing page, error messages.

**Always:**
- Short sentences
- Active voice
- Concrete nouns
- Confidence without bravado

**Never:**
- "Effortless", "seamless", "streamline", "leverage", "robust"
- Exclamation marks (one per page max, only in success states)
- AI-isms: "we believe", "we're on a mission", "we're so excited"
- Long paragraphs when one line does the job

### Quick translator

| Don't | Do |
|---|---|
| "Streamline your client communications" | "Send one link. Skip the email thread." |
| "Effortlessly organize your files" | "Drop files in. Send the link. Done." |
| "We're so excited to share..." | "New: magic link client access." |
| "Powerful, intuitive workspace" | "A folder structure your clients can follow." |

---

## Color palette

| Token | Hex | Use |
|---|---|---|
| Ink | `#0F0F0F` | Primary text, deep surfaces |
| Paper | `#FBFAF7` | Background — warm off-white, not clinical |
| Paper elevated | `#FFFFFF` | Cards, modals |
| Line | `#ECEAD9` | Borders, dividers |
| Mute | `#7A7773` | Secondary text |
| Accent | `#C84B31` | CTAs, focus, brand moments — terracotta |
| Accent soft | `#F4E4DC` | Pinned states, callouts, soft backgrounds |
| Success | `#2A6E4F` | Confirmations only |
| Warning | `#C2783A` | Duplicate flags, soft warnings |
| Danger | `#A03C2C` | Destructive actions only |

All tokens live in [app/globals.css](../app/globals.css) as CSS variables — change them once, the whole app re-themes.

**Why terracotta?** Every B2B SaaS uses indigo (Stripe, Notion, Vercel-ish). Terracotta is rare, distinctive, signals creative-industry, and is instantly ownable. Discipline > trend-following.

---

## Typography

| Role | Font | Weight | Use |
|---|---|---|---|
| Display | **Instrument Serif** | 400, italic | Headlines >24px only |
| Body, UI | **Geist Sans** | 400, 500 | Everything else |
| Numerals, tags, system labels | **Geist Mono** | 500 | Dates, IDs, "v0.1", etc. |

**Critical rule:** Display serif only for headlines >24px. Below that, always Geist sans. Mixing serif at small sizes looks amateur.

All loaded via `next/font/google` in [app/layout.tsx](../app/layout.tsx).

---

## Logo

A wordmark. **Ayuvam** in Instrument Serif italic, in `--ink`.

No icon mark. The typography *is* the logo.

For favicons / app icons: lowercase **a** in Instrument Serif italic on a `--accent` (terracotta) background, rounded square.

This is the Vercel / Arc / Pitch playbook: when your typography is good enough, you don't need a mark.

---

## Layout principles

1. **Generous whitespace.** Sections breathe.
2. **One accent per screen.** Terracotta appears once or twice, not everywhere.
3. **Hairlines, not heavy borders.** `--line` at 1px is the maximum.
4. **No shadows by default.** Shadows are for hover states on interactive cards only.
5. **Sticky nav uses backdrop blur.** Frosted glass over `--paper`.

---

## Type scale (the only sizes)

| Role | Size | Face | Use |
|---|---|---|---|
| display | ≥24px | Instrument Serif | Headlines only |
| title | 16px semibold | Geist Sans | View titles, modal titles |
| body | 14px | Geist Sans | Names, inputs, primary content |
| secondary | 13px | Geist Sans | Descriptions, notes |
| label | 11px uppercase | Geist Mono | Table headers, field labels, eyebrows |
| micro | 10px | Geist Mono | Counts, captions, chips |

**Dates, indexes, counts, and URLs are always Geist Mono.** No ad-hoc sizes outside this scale.

## Interaction rules

- **Accent restraint in tables.** Link cells are `--mute`, turning accent on hover. Terracotta belongs to the primary CTA, pinned states, and brand moments — not every URL.
- **Shadows:** none decorative. One pop shadow for portaled menus/modals. Marketing mockup frames may use a single soft drop.
- **Motion:** 120–150ms ease-out on hover/menus. The marketing `reveal` animation never ships inside the app.
- **Radius registers:** app surfaces `rounded-lg/xl`; marketing CTAs are pills (`rounded-full`). Don't mix.
- **Focus:** every interactive element gets a visible `focus-visible` ring (`ring-accent/40`).

---

## Reference brands (study these)

The brands Ayuvam is aesthetically aligned with:

- **Linear** → typography, motion, dark restraint
- **Vercel** → minimal black/white, sharp grid
- **Raycast** → premium feel, subtle gradients
- **Arc** → bold typography, playful copy
- **Fey** → finance app, stunning gradients with restraint
- **Pitch** → typography-heavy SaaS marketing
- **Resend** → developer-focused, clean

When in doubt about a design choice: *what would Linear do?*

---

*See also:* [PRODUCT.md](PRODUCT.md) · [TECHNICAL.md](TECHNICAL.md)
