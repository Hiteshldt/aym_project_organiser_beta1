# 08 · Service — Neon (Postgres database) — audit

Scope: `db/schema.ts`, `db/index.ts`, the `db:*` scripts, migration approach,
backups.

**Overall:** clean schema with good index coverage and a sensible lazy serverless
client. The risk area is **schema-change discipline** (`db:push` + a pile of
one-off scripts) and **backups** before real customer data lands.

---

## 🔴 P1

**8.1 — No real backup/recovery posture for customer data.** Deletes are **hard
deletes with cascades** (workspace → folders → items → history, and blob files),
and there's no soft-delete. Combined with Neon's free/launch tier (limited
point-in-time recovery), a wrong admin "Delete workspace" or a bad migration is
**unrecoverable**. Before onboarding paying customers:
- confirm Neon plan + **PITR / backup retention** is enabled, and
- consider soft-delete (a `deletedAt` column) for workspaces/items so an
  accidental delete is reversible.

---

## 🟠 P2

**8.2 — Schema changes are undisciplined.** `package.json` exposes `db:push`
*and* `db:generate`/`db:migrate`, but the actual workflow is `db:push` plus a
stack of hand-run scripts (`db:add-indexes`, `db:add-ordering-and-search`,
`db:add-file-url`, …). Consequences:
- `db:push` can **drop/recreate** columns on certain changes → silent data loss
  on a rename or type change in production.
- No migration history = no rollback, no record of what schema a given deploy
  expects.
- Index/extension state (e.g. `pg_trgm`, the trgm GIN index) lives **outside**
  `schema.ts`, so it isn't reproduced by `db:push` and could be flagged for
  removal (cross-ref backend 3.2).
- Recommendation: adopt `db:generate` + `db:migrate` as the single path before
  v1, fold the one-off scripts' DDL into migrations, and stop using `db:push`
  against production.

---

## 🟡 P3

**8.3 — `historyCount` subquery per row.** `items` GET runs a correlated
`(select count(*) from item_history …)` per row (`items/route.ts:73`). Fine at
current scale; with large folders it's N subqueries. Consider a join/group or a
denormalised counter if it shows up in latency.

**8.4 — Hard limit of 500 items per folder** (cross-ref backend 3.3) — the query
truncates silently.

**8.5 — Region latency.** DB is `IAD1`; keep Vercel functions in/near us-east to
avoid cross-region round trips on every query (cross-ref Vercel 6.6).

---

## ✅ Verified good
- Lazy `Proxy` DB client (`db/index.ts`) — build doesn't fail when
  `DATABASE_URL` is absent; connection created on first use.
- `neon-http` driver — right choice for Vercel serverless (no pooling headaches).
- Index coverage on hot columns: company, folder, url+company, share token,
  subscription customer.
- FKs use `onDelete: cascade` consistently; referential integrity is sound.
- Enums (roles, plan tier, status, view type, colors) are DB-level, not loose
  strings.
