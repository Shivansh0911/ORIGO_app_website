# Origo — Deployment Guide

> Rewritten 2026-08-05. The previous version described Railway Postgres,
> Cloudflare R2, and Firebase/FCM — **none of which the code actually uses.**
> Storage is Supabase Storage via a plain `fetch` wrapper
> (`backend/src/utils/supabase.ts`), the database is Supabase Postgres, and
> push notifications aren't built. Following the old doc would have had you
> setting up two services that do nothing. This version matches the code.

For the current launch: **web only** (PWA). The `origo-app/` Expo mobile app
exists but isn't shipping — out of scope, see `CLAUDE.md` / `docs/BUILD_PLAN.md`.

```
Internet
  ├── origo-web (Vercel)      — static Vite SPA
  │     └── API calls → backend
  └── backend (Railway)       — Node/Express + Socket.IO, port from $PORT
        ├── Supabase Postgres (via connection pooler — see below)
        ├── Supabase Storage  (avatars public, student IDs private)
        ├── Upstash Redis     (sessions, rate limits, OTP)
        ├── Resend            (OTP email — fallback only; Google Workspace
        │                      auto-verifies BITS students, see auth.service.ts)
        └── Google OAuth      (primary verification path)
```

Razorpay, Firebase/FCM, AWS/R2 are **not required** — Premium/Boost/payments
are out of scope for this launch (see `CLAUDE.md`), and storage/push don't
use them regardless of launch scope. Don't set `RAZORPAY_KEY_*` — pseudo-mode
is the intended state (`docs/decisions/0002`).

---

## STEP 1 — Supabase (database + storage)

You already have a project (`kxpqldbwptwcueusohqh`). Two things to get right,
both because of one fact: **the direct database host resolves to IPv6 only**
and is unreachable from most Indian networks. Always use the pooler.

### 1A. Connection strings

Supabase dashboard → **Settings → Database → Connection pooling**. You need
**two** URLs, same host, different port/mode:

```
DATABASE_URL=postgresql://postgres.kxpqldbwptwcueusohqh:<PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.kxpqldbwptwcueusohqh:<PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

- `DATABASE_URL` — port **6543**, transaction mode, `?pgbouncer=true`. App runtime.
- `DIRECT_URL` — port **5432**, session mode. Migrations only (transaction
  pooling can't do prepared statements, which `prisma migrate` needs).
- Username is `postgres.<PROJECT_REF>` **with the dot** — easy to miss, and
  omitting it produces an opaque auth failure that looks unrelated.

### 1B. Storage buckets

Storage → create two buckets if they don't exist:
- `origo` — **public** (avatars)
- `origo-private` — **private** (student ID uploads for manual verification)

### 1C. Run migrations against production

From `backend/`, with the two URLs above set in your shell (or a temporary
`.env`):

```bash
npx prisma migrate deploy
npx prisma db seed
```

`migrate deploy` uses `DIRECT_URL`; the running app uses `DATABASE_URL`. Both
must be set or Prisma will use the wrong one for the wrong job.

---

## STEP 2 — Backend on Railway

```bash
npm install -g @railway/cli
railway login          # opens a browser — this is the step only you can do
cd backend
railway init
railway link
```

### 2A. Environment variables

Railway dashboard → your service → Variables:

```
DATABASE_URL            = (from 1A)
DIRECT_URL               = (from 1A)
REDIS_URL                = (Upstash — rediss://..., TLS required)
JWT_SECRET                = (openssl rand -hex 32)
JWT_REFRESH_SECRET        = (openssl rand -hex 32 — different value)
FIELD_ENCRYPTION_KEY      = (openssl rand -hex 32 — different again)
BLIND_INDEX_KEY           = (openssl rand -hex 32 — different again)
SUPABASE_URL              = https://kxpqldbwptwcueusohqh.supabase.co
SUPABASE_SERVICE_ROLE_KEY = (Supabase → Settings → API → service_role)
RESEND_API_KEY             = re_...        (OTP fallback path only)
GOOGLE_CLIENT_ID           = (must match origo-web's VITE_GOOGLE_CLIENT_ID)
NODE_ENV                   = production
PORT                        = 3001
ALLOWED_ORIGINS            = https://<your-vercel-domain>
```

`FIELD_ENCRYPTION_KEY` and `BLIND_INDEX_KEY` must be **different** 64-hex-char
values — the server refuses to boot if either is malformed or missing
(`server.ts` `checkEnv()`, deliberate — see `CLAUDE.md`).

Do **not** set `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`. Setting only one (or
a typo'd pair) will now fail startup by design — see `docs/BUILD_PLAN.md` B9.

### 2B. Deploy

```bash
railway up
# or connect GitHub for auto-deploy on push to master:
# Railway dashboard → Settings → connect ORIGO_app_website → root: backend/
```

Build command: `npm install && npx prisma generate`. Start command: `npm start`.

### 2C. Get your backend URL

Railway dashboard → Settings → Domain → Generate domain. You'll need this for
step 3 and for Google OAuth's authorised-origins list.

---

## STEP 3 — Web app on Vercel

1. vercel.com → Import → GitHub → `ORIGO_app_website`
2. Root directory: `origo-web`
3. Framework preset: Vite · Build: `npm run build` · Output: `dist`
4. Environment variables:
   ```
   VITE_API_URL          = https://<your-railway-domain>
   VITE_GOOGLE_CLIENT_ID  = (same client ID as backend's GOOGLE_CLIENT_ID)
   ```
5. Deploy.

### Custom domain (optional, do it if you have one — see CLAUDE.md's note on
credibility for QR posters)

Vercel → Domains → add it, point DNS per Vercel's instructions.

---

## STEP 4 — Google OAuth authorised origins

Google Cloud Console → APIs & Services → Credentials → your OAuth client:

Add **both**:
- Your Vercel URL (`https://your-app.vercel.app`)
- `http://localhost:3000` (keep — local dev still needs it)

**This is the step that fails silently.** If skipped, Google sign-in throws a
console-only error (`[GSI_LOGGER]: The given origin is not allowed`) with
nothing visible to the user — they just see "Continue with Google" do nothing.

---

## STEP 5 — End-to-end verification

Do this on an actual phone, not just curl, before calling it launched:

```
[ ] https://<backend-url>/health returns 200
[ ] Web app loads at the Vercel URL
[ ] Google sign-in completes and auto-verifies a BITS test account
[ ] Interests picker is non-empty (confirms prisma db seed ran)
[ ] Discover loads without a Dating chip
[ ] Rizz: start a session, send 2 messages, confirm 3rd is blocked (WAITING)
[ ] Pulse: create one, respond from a second account, confirm it closes at cap
[ ] Ship: works with zero prior matches
[ ] Happening shows real seeded events, not empty
[ ] Socket.IO connects (open two tabs, send a message, confirm live delivery)
```

If Google sign-in silently does nothing → Step 4.
If Discover/Rizz/Pulse/Ships all 403 → `requireVerified` failing → check the
account actually completed OTP or Google auto-verify.
If `/health` 500s on boot → check Railway logs; almost always a missing or
malformed env var, and the boot error message names which one.

---

## Troubleshooting

| Issue | Cause |
|---|---|
| `ECONNREFUSED` / DB times out | Using the *direct* Supabase host, not the pooler. See Step 1A. |
| Prisma migrate hangs or fails with prepared-statement errors | Migrations ran against `DATABASE_URL` (transaction mode) instead of `DIRECT_URL`. |
| `postgres: password authentication failed` | Missing the `.kxpqldbwptwcueusohqh` in the pooler username. |
| Server won't boot, names a missing env var | Intentional — `checkEnv()` fails closed. Set the named var. |
| Google button does nothing, no error shown to user | Origin not in Google Console's authorised list (Step 4). Check browser console. |
| CORS error in browser console | `ALLOWED_ORIGINS` on Railway doesn't include the Vercel URL exactly (scheme + host, no trailing slash). |
| Redis `NOAUTH` / connection refused | Upstash URL must be `rediss://` (TLS), not `redis://`. |

---

## Out of scope for this launch — don't set up

Razorpay live keys, Cloudflare R2, Firebase/FCM push, Android/EAS build. None
of these are referenced by current backend code, and building them now is
effort spent on features that are explicitly deferred — see `CLAUDE.md` and
`docs/BUILD_PLAN.md`'s "explicitly out of scope" list.
