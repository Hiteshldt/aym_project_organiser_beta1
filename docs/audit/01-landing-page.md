# 01 · Landing / marketing site — audit

Scope: `app/(marketing)/*`, `components/marketing/*`, `app/layout.tsx` metadata,
relevant `globals.css`. Reviewed the home page (Hero, BeforeAfter, Bento,
HowItWorks, Pricing, FAQ, FinalCTA), Nav, Footer, and the reveal system.

**Overall:** the page is well-crafted and on-brand — strong copy, consistent
spacing rhythm, good dark-mode handling. The issues below are mostly *accuracy*
and *resilience*, not visual. A handful matter before marketing.

---

## 🔴 P1

**1.1 — Reveal animation hides the whole page if JS doesn't run.**
`app/globals.css:414` sets `[data-reveal]{opacity:0}` and content is only made
visible when `RevealProvider` (client JS) adds `.reveal-in`. Every section uses
`data-reveal`, including the `<h1>`. If JS fails, is slow, is blocked, or a
crawler doesn't execute it, **the entire page renders blank.**
- Risk: SEO (some crawlers don't run JS / time out on it), accessibility, and a
  white-screen for anyone on a flaky connection.
- Fix: add a no-JS / fail-safe fallback — e.g. a `<noscript>` rule that forces
  `[data-reveal]{opacity:1}`, and/or a setTimeout in `RevealProvider` that
  reveals everything after ~1.5s regardless. Reduced-motion already reveals
  immediately; the default path is the gap.

---

## 🟠 P2 — fix before marketing

**2.1 — `metadataBase` points to the wrong domain.**
`app/layout.tsx:25` → `new URL("https://ayuvam.app")`, but the live site is
**ayuvam.com**. All Open Graph / Twitter-card / canonical URLs resolve against
`ayuvam.app`, so social previews and canonical tags point at the wrong (or
non-existent) domain. Change to `https://ayuvam.com`.

**2.2 — Inaccurate security claim: "signed URLs".**
`components/marketing/FAQ.tsx:21` says *"Files are stored on Vercel Blob with
signed URLs."* The store is now **public** — files are served via public
(unguessable) URLs, not signed/expiring ones. This is a factual claim on a
"Is my data secure?" answer; reword to something true, e.g. *"served over
HTTPS via unguessable URLs, isolated per workspace."* (Pre-marketing trust + it
shouldn't overstate security.)

**2.3 — Feature claims to verify against the real product (don't market what
isn't built).** Several places promise behaviour I should confirm in the
backend/services audits:
- *"invite them by email — they click a magic link"* (FAQ 2.13, Bento "Magic
  link access", Pricing "Magic-link client access"). Confirm the share flow
  actually **emails** the client a link. If it's copy-the-link-only, "invite by
  email / magic link" is misleading.
- *"Start Solo trial" / "Start Studio trial"* CTAs (`Pricing.tsx:45,62`).
  Confirm a real trial is configured in Paddle. If there's no trial, change to
  "Start Solo" / "Get Studio" — "trial" sets a false expectation and could be a
  refund dispute later.

**2.4 — Pricing/feature copy lives in 3–4 places and is already drifting.**
The same plan data is hand-maintained in:
- `components/marketing/Pricing.tsx` (this `PLANS` array)
- `app/(marketing)/pricing/page.tsx`
- `lib/billing/plans.ts` (`PLAN_DISPLAY`)
- `components/billing/PlanCards.tsx` (in-app)
Already inconsistent: marketing Solo lists "Unlimited items" and Studio lists
"Priority **email** support", which differ from `PLAN_DISPLAY`. Risk: you change
a price/limit in one place and the others lie. Fix: make `lib/billing/plans.ts`
the single source and have the marketing pricing read from it.

**2.5 — Placeholder Twitter link.**
`components/marketing/Footer.tsx:54` → `href="https://twitter.com"` (generic, no
handle). Either point to the real account or remove it before launch — a dead
social link in the footer reads as unfinished.

**2.6 — No mobile navigation.**
`components/marketing/Nav.tsx` hides the center links (Features / Pricing / How
it works) and "Log in" behind `md:`/`sm:` with no hamburger. On phones the
header is just logo + "Start free" — visitors can't reach Pricing/Features from
the nav (only by scrolling or via the footer). Add a simple mobile menu.

---

## 🟡 P3 — polish / cleanup

**3.1 — Dead allowlist routes.** `middleware.ts` lists `/about` and `/changelog`
in `PUBLIC_PATHS`, but neither page exists (would 404). Nothing links to them,
so harmless — but remove from the allowlist or build the pages.

**3.2 — Intentional demo typo.** `Bento.tsx:89` shows "brand guidlines" to
demo typo-tolerant search. It's deliberate, but a first-time viewer may read it
as a mistake; consider a clearer signal (e.g. a small "did you mean" hint in the
mock) — optional.

**3.3 — "Contact sales" in the hero** (`Hero.tsx:59`) for a self-serve,
early-access product may be premature. Consider "See pricing" or "Watch a demo"
until sales motion exists. Optional.

**3.4 — "No annual lock-in" vs annual default.** Pricing copy says *"no annual
lock-in"* while the toggle defaults to Annual and shows "Billed $X/year". Not
wrong (FAQ clarifies you keep access to period end), but the messaging is in
mild tension — worth a copy pass.

**3.5 — Hardcoded mock colors.** Hero/Bento status chips use raw Tailwind
(`bg-green-50`, `bg-amber-50`, …) rather than brand tokens. Fine for a static
mock; only matters if you re-theme.

---

## ✅ Verified good
- Anchor links resolve: Nav `#features`→Bento, `#how`→HowItWorks, both with
  `scroll-mt-20`. Footer links all point to existing routes.
- File-size claim (20MB) is consistent across Hero/HowItWorks/BeforeAfter/FAQ
  and matches `MAX_FILE_SIZE`.
- Annual discount math (−17%) is correct for all tiers.
- Dark-mode variants present on marketing color chips.
- FAQ accordion uses `aria-expanded`; reduced-motion paths handled.
