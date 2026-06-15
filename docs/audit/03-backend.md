# 03 · Backend — API routes & data — audit

Scope: `app/api/**`, `db/schema.ts`, `lib/{auth,email,shares,shortcode,blob}.ts`.
Looked at auth coverage, input handling, query safety, tokens, indexes,
pagination, and the email/webhook flows.

**Overall:** the security fundamentals are genuinely good — every protected
route checks the session, queries are parameterized, share tokens are strong,
and the Paddle webhook is signature-verified. No P1s. The gaps are operational:
rate limiting, where the search index lives, and a few DRY/scale items.

---

## 🟠 P2 — fix before marketing

**3.1 — No rate limiting anywhere.** `grep` finds no limiter in `app/` or `lib/`.
Two endpoints matter at launch:
- **`/api/contact`** — public POST. It has a honeypot, but bots can still flood
  `contact@ayuvam.com`. Add a per-IP limit (e.g. 5/min).
- **Credentials login** (`lib/auth.ts`) — no throttle on password attempts.
  bcrypt slows brute force but doesn't stop it; add per-IP/account attempt
  limiting.
- Share-token endpoint does **not** need it — tokens are 256-bit
  (`randomBytes(32)`), so guessing is infeasible.
- Suggested: Upstash Ratelimit (works on Vercel edge) or a small in-memory/KV
  limiter for the two routes above.

**3.2 — The search index isn't in the schema source of truth.** The typo-tolerant
search depends on `pg_trgm` + a GIN index, but they're created by a **one-off
script** (`db/add-ordering-and-search.ts:47-49`), not in `db/schema.ts`. Since
the project deploys schema with `db:push` (which reads `schema.ts`), this means:
- a fresh `db:push` won't recreate the extension/index, and drizzle-kit may
  flag the "extra" index for removal;
- only `items.title` has a trgm index — `description`, `notes`, `url`, and tags
  are also searched (`search/route.ts`) and fall back to sequential `ILIKE`
  scans, which slow down as data grows.
- Action: confirm the index actually exists in the production DB right now, then
  document index/extension management as a deliberate migration step (and
  consider trgm indexes on the other searched columns).

---

## 🟡 P3 — polish / scale-later

**3.3 — No pagination.** A folder loads up to `.limit(… : 500)` items
(`items/route.ts:80`) and then silently truncates. Fine for now; a power user
with >500 deliverables in one folder would lose rows with no indication. Add
pagination or at least a "showing first 500" notice before that's reachable.

**3.4 — `getCompanyAccess` is duplicated.** Defined separately in
`items/route.ts` and `folders/route.ts` (and the access pattern is repeated in
others). Extract one `lib/access.ts` helper to avoid drift in the
membership/role check — it's the core authorization primitive, so duplication
here is the riskiest kind.

**3.5 — Raw error message leaked from upload route.** `upload/route.ts:64-65`
returns `e.message` to the client. Low risk, but map to a generic message and
log the detail server-side instead.

**3.6 — Manual validation, no shared schema.** Each route hand-checks inputs.
Mostly fine, but bounds rely on DB `varchar` limits — an over-long field throws
a 500 (DB error) rather than a clean 400. A light schema (zod) on the
write routes would make validation consistent and user-friendly. Optional.

---

## ✅ Verified good
- **Auth coverage:** every `workspace/*`, `user`, `billing/*`, and `admin/*`
  route calls `auth()`; admin routes additionally gate on `role === "admin"`.
  The only routes without `auth()` are intentional: NextAuth handler, `/api/
  contact` (public), `/api/share/[token]` (public, token-gated), and the Paddle
  webhook (signature-verified).
- **Query safety:** all queries go through Drizzle; the search route uses the
  parameterized `sql` tag (`EXTRACT(... ) = ${value}`, `ilike(col, pattern)`),
  so there's no SQL injection even with free-text input.
- **Share security:** tokens are 256-bit base64url; the public read checks
  `revokedAt IS NULL` and `expiresAt` in the future, and records
  `lastAccessedAt`.
- **Share invites really email** (`shares/route.ts` → `sendShareInvite`),
  returning an `emailStatus` and never blocking share creation on email
  failure — so the landing "invite by email" claim is accurate.
- **Webhook** verifies `Paddle-Signature` and upserts by user/subscription id
  (idempotent for duplicate deliveries).
- **Indexes** exist on the hot lookup columns (company, folder, url+company,
  share token, subscription customer).
- **Blob cleanup** on delete is wired (item / folder subtree / workspace).
