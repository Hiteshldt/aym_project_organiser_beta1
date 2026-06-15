# 05 · Service — Google OAuth / Auth — audit

Scope: `lib/auth.ts` (NextAuth v5), `middleware.ts`, session/JWT, Google +
Credentials providers, role model.

**Overall:** solid auth setup — JWT sessions, minimal OAuth scopes, role carried
in the token, sensible account-by-email linking. The notable gap is no email
verification on password signup.

---

## 🟠 P2

**5.1 — No email verification for password signups.** The Credentials provider
(`lib/auth.ts`) authenticates against `passwordHash` but there's no
confirm-your-email step on registration. Anyone can register with an address
they don't own (e.g. someone else's), which:
- pollutes your user list / metrics,
- could let someone "squat" an email a real client later tries to use,
- weakens any future per-account trust.
Google sign-ups are inherently verified (Google asserts the email); only the
password path is exposed. Add a verification email on credentials signup before
serious marketing.

**5.2 — Confirm production OAuth config.** Pre-launch checklist (the earlier
www/apex CORS issue lived here):
- Google Cloud console → Authorized redirect URI is **exactly**
  `https://ayuvam.com/api/auth/callback/google` (apex, https, no trailing
  slash), and the JS origin is `https://ayuvam.com`.
- `NEXTAUTH_URL=https://ayuvam.com`, `AUTH_TRUST_HOST=true`, `AUTH_SECRET` set in
  Vercel Production.
- OAuth consent screen is **Published** (not "Testing"), or only test users can
  sign in.

---

## 🟡 P3

**5.3 — Account-linking nuance.** A Google sign-up creates a user with
`passwordHash: ""`; the Credentials path correctly refuses login until they set
a password in Settings. The reverse (password user later "Continue with Google"
on the same email) links to the existing row by email — fine, but worth a
deliberate test so there's never a duplicate-account path.

**5.4 — Self-serve users get `manager` globally.** New Google users are created
with `role: "manager"` (`lib/auth.ts`). That's the app-wide role (admin /
manager / reader), distinct from per-workspace membership roles. It's the right
default, just confirm no flow accidentally grants `admin`.

**5.5 — Credentials brute force.** (Cross-ref backend 3.1.) No attempt
throttling; bcrypt cost is the only barrier. Add login rate limiting.

---

## ✅ Verified good
- Minimal scopes — only profile/email (`prompt: "select_account"`); no
  unnecessary Google API access.
- Role + DB id injected into JWT in the `jwt` callback; `session` callback
  exposes them — admin gating relies on this and it's consistent.
- Middleware redirects unauthenticated users and bounces logged-in users away
  from `/login`; public paths and share/webhook exemptions are explicit.
- Passwords hashed with bcrypt (cost 12).
