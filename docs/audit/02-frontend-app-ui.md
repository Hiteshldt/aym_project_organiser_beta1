# 02 · Frontend — main app UI — audit

Scope: `components/workspace/*` (RegisterGrid, WorkspaceShell, FolderTree,
ItemPanel, FolderOverview, modals), `components/settings/SettingsShell.tsx`,
`components/share/ShareView.tsx`. Focus on the three things you called out:
items-section visuals, inconsistent text sizing, and the profile page.

**Overall:** the app is functional and the register concept is strong. The
weaknesses are exactly what you felt — an undisciplined type scale, a
desktop-only items table, and a settings page that wastes space. None are
deep bugs; they're polish that will noticeably lift perceived quality.

---

## 🟠 P2 — fix before marketing

**2.1 — No consistent type scale (your "some text bigger, some smaller").**
Across `components/workspace/*` the font sizes are: `text-xs` ×90, `text-sm`
×30, plus one-off arbitrary values `text-[11px]` ×42, `text-[10px]` ×13,
`text-[13px]` ×2. So the UI mixes 10 / 11 / 12 / 13 / 14px with no rule.
- Inside a single register row this is visible: the `#` cell is `text-[11px]`
  (`RegisterGrid.tsx:450`), the **Name** inherits the table's `text-sm` (14px),
  the **Description** is `text-[13px]` (`:479`), the column headers are 11px,
  group counts 10px. Five sizes in one row → uneven rhythm.
- Fix: define a small semantic scale (e.g. `--text-caption` 11px, `--text-body`
  13–14px, `--text-label` for mono caps) and replace the arbitrary `text-[Npx]`
  values. One pass makes the whole app feel calmer and intentional.

**2.2 — Lots of sub-12px text hurts readability.** 10–11px is widely used for
body-ish content (descriptions, meta, link/date cells), not just micro-labels.
On smaller/retina-scaled screens and for clients skimming, this is hard to read.
Lift secondary text to 12–13px and reserve 10–11px for true mono labels.

**2.3 — The items register is desktop-only on mobile.**
`RegisterGrid.tsx:373` → `<table class="… min-w-[720px]">` inside an
`overflow-auto`. On a phone the deliverables table becomes a horizontal-scroll
strip; Description/Note/Link/Date columns are also `hidden md/lg`. Scanning your
work (or a client scanning theirs) on mobile is awkward.
- Fix: below `md`, render rows as **stacked cards** (title + status + date +
  link, vertically) instead of a scrolling table. This is the single biggest
  "items section visual" win, and it also improves the client share view.

**2.4 — The profile / settings page wastes width and scrolls long.**
`SettingsShell.tsx` is one centered `max-w-2xl` (672px) column with four
stacked cards — Profile, Billing (the full plan comparison!), Password, Session
— so on desktop there are wide empty margins and a long vertical scroll, with
the heavy billing panel buried mid-scroll. This is exactly the "long scroll,
wasted width" you described.
- Recommended redesign — **sectioned/tabbed, wider canvas:**

  ```
  ┌───────────────────────────────────────────────┐
  │  Settings                                       │
  │  [ Account ] [ Billing ] [ Security ]   ← tabs  │
  ├───────────────────────────────────────────────┤
  │  Account ▸  ┌── Profile ──┐  ┌── Session ──┐    │
  │             │ name/email  │  │ signed in…  │    │
  │             └─────────────┘  └─────────────┘    │
  └───────────────────────────────────────────────┘
  ```
  - Tabs (Account / Billing / Security) so the page isn't one long scroll and
    billing gets its own room.
  - Widen to `max-w-4xl` and use a 2-column card grid within a tab so the space
    isn't wasted.
  - Keep the existing cards' content; this is layout, not new features.

---

## 🟡 P3 — polish

**3.1 — Hover-only row actions.** Register row actions are `opacity-0
md:group-hover:opacity-100` (`RegisterGrid.tsx:612`). Fine on desktop, but
discoverability is low for new users; consider a persistent "⋯" affordance.

**3.2 — Mockup vs real consistency.** The landing mock and the real register
style status chips slightly differently (raw colors vs `FOLDER_COLORS` tokens).
Align so a visitor's expectation matches the product.

**3.3 — Logo hidden on mobile.** `WorkspaceShell.tsx:418` hides the "Ayuvam"
wordmark below `sm`. Minor brand presence loss in-app on phones.

**3.4 — Spacing tokens.** Same discipline issue as type: padding/margins are
mostly fine but worth a quick consistency pass alongside the type scale.

---

## 🔎 Needs its own dedicated pass (flagged, not yet deep-reviewed)

**ShareView (`components/share/ShareView.tsx`, 550 lines)** — this is the
client-facing screen and the literal "money shot" for marketing screenshots.
It almost certainly inherits the same type-scale issues and the mobile-table
concern. Recommend a dedicated visual QA of the share view (desktop + mobile,
light + dark) before any marketing capture. I did not deep-read it in this pass
to avoid asserting unverified issues.

---

## ✅ Verified good
- RegisterGrid uses shared `CELL`/`HEAD` constants — the structure is sound; the
  issue is per-column size overrides, not chaos.
- Sticky table header, drag-to-reorder, inline cell edit, grouped rows, flash-on
  -add, skeleton loader — all present and working.
- Dark mode is handled throughout via tokens.
- Layout uses a proper `h-screen` flex shell with scroll regions (no nested
  scroll jank observed).
