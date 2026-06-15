# 07 · Service — Vercel Blob (file storage) — audit

Scope: `app/api/workspace/upload/route.ts`, `lib/blob.ts`, client `upload()` in
`AddItemModal.tsx`, store configuration.

**Overall:** newly set up and now working. Client-direct upload (bypasses the
4.5MB serverless limit), allowlisted content types, size cap, and orphan cleanup
on delete are all in place. Remaining items are about the public-access model
and storage hygiene.

---

## 🟠 P2

**7.1 — Files are public-by-URL; document the real security posture.** The store
is a **public** Blob store, so any uploaded file is readable by anyone with its
URL — the URL is unguessable, but access is **not** gated by the share token or
login. If a blob URL leaks (forwarded email, browser history, referrer), the
file is exposed regardless of share revocation.
- This is an inherent trade-off of the no-login client view, and is fine for
  most deliverables — but:
  - the landing FAQ's "signed URLs" claim must be corrected (cross-ref 01/2.2);
  - decide consciously whether sensitive client files are acceptable under this
    model. If not, the alternative is a private store + server-proxied,
    token-checked downloads (more code, breaks direct embedding).

**7.2 — Limit enforcement (storage quota).** Per-plan storage caps
(`storageMb`: 100MB free → 50GB agency) are **not enforced** on upload
(cross-ref Paddle 09/9.1). A free user can keep uploading 20MB files indefinitely
— direct Blob cost to you, and the advertised cap is fiction. Enforce
cumulative storage per account before launch.

---

## 🟡 P3

**7.3 — Content type is client-asserted.** `allowedContentTypes` filters on the
MIME the browser reports, which a determined user can spoof. Low risk for a
deliverables tool (no execution), but don't treat the allowlist as a security
boundary.

**7.4 — Orphan cleanup is best-effort + no reconciliation.** `lib/blob.ts`
deletes on item/folder/workspace delete but never throws; a failed delete still
orphans a file. There's also no sweep for files orphaned *before* cleanup
existed. Consider a periodic reconciliation job (compare store ↔ DB
`fileUrl`/`fileKey`) for true hygiene. The store Browser tab can clear old
orphans manually for now.

**7.5 — Dev environment token.** The store is connected to Production + Preview
only; local dev needs the token copied into `.env.local` manually (documented in
ADMIN.md). Optionally connect Development too.

---

## ✅ Verified good
- Client-direct upload via `handleUpload` token route → no 4.5MB body limit;
  `maximumSizeInBytes = MAX_FILE_SIZE` (20MB) enforced server-side.
- Missing-token now fails with a clear message (recent fix).
- Delete paths free storage: item, full folder subtree, and admin workspace
  delete (`lib/blob.ts`, recent commit).
- Only `blob.vercel-storage.com` URLs are ever deleted — external links are
  never touched.
- Public access is the correct choice for the no-login client view (the prior
  private store was the right thing to abandon).
