# 04 · Service — Resend (email) — audit

Scope: `lib/email.ts`, the contact + share-invite flows, env config.

**Overall:** the cleanest integration in the codebase. Lazy client, graceful
no-op without a key, all user input escaped, both HTML + plain-text parts,
reply-to wired for contact. Findings are config/deliverability, not code.

---

## 🟠 P2

**4.1 — Sender falls back to a sandbox domain.** `getFromAddress()`
(`lib/email.ts:19`) defaults to `onboarding@resend.dev` if `RESEND_FROM_EMAIL`
is unset. If that env var is ever missing in production, every invite/contact
mail silently sends from `resend.dev` — which looks untrustworthy and may be
rejected. Confirm `RESEND_FROM_EMAIL=hello@ayuvam.com` is set in Vercel
Production, and consider hard-failing (or logging loudly) instead of falling
back silently.

**4.2 — Deliverability checklist before marketing.** You verified the sending
domain, but confirm the full set is in place so invites don't land in spam:
- SPF + DKIM (Resend sets these on domain verify) ✓ confirm green in Resend.
- **DMARC** record (`_dmarc.ayuvam.com`) — often missing; add at least
  `p=none` to start collecting reports, ideally `p=quarantine` later.
- Send a test invite to a Gmail + Outbook + an Apple Mail address and check
  inbox placement.

---

## 🟡 P3

**4.3 — Hardcoded inbox.** `CONTACT_INBOX = "contact@ayuvam.com"`
(`lib/email.ts:69`) is hardcoded rather than env-driven. Fine, but an env var
makes it changeable without a deploy.

**4.4 — No rate limit on the contact send.** (Cross-ref backend 3.1.) Without it,
the contact form can be used to spam your inbox — Resend usage counts against
your quota too.

**4.5 — Free-tier ceiling.** Resend's free tier (~100/day, 3k/month) is fine for
early access but will throttle invites once you have volume. Watch usage; plan
the paid upgrade alongside marketing.

**4.6 — Email errors surfaced to client.** `emailError` from Resend is returned
in the share API response. Low risk; consider logging server-side and showing a
generic "couldn't email — here's the link to copy" instead.

---

## ✅ Verified good
- All interpolated user values pass through `escapeHtml`/`escapeAttr` → no HTML
  injection in emails.
- Both `html` and `text` parts sent (better deliverability + accessibility).
- Contact uses `replyTo: visitor` so replying in the inbox reaches them.
- Share-invite failure never blocks share creation (returns `emailStatus`).
- Hidden preheader text on the invite (good inbox preview).
