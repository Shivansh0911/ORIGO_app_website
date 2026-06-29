# Origo — Full Deployment Guide

End-to-end hosting for backend, website, and Android app.

---

## Architecture Overview

```
Internet
  │
  ├── Android App (APK/Google Play)
  │     └── API calls → backend
  │
  ├── origo-web (Vercel)
  │     └── Static landing site
  │
  └── backend (Railway)
        ├── Node.js + Express API  :4000
        ├── Socket.io (same server)
        ├── PostgreSQL (Railway add-on)
        └── Redis (Upstash, external)
```

---

## STEP 1 — Third-Party Services Setup

Do these first — you need their keys before deploying anything.

### 1A. Upstash Redis (free tier)
1. Go to console.upstash.com → Create Database → Region: ap-south-1 (Mumbai)
2. Copy **REDIS_URL** (format: `rediss://...@...upstash.io:6379`)

### 1B. Resend (email)
1. resend.com → Create API Key
2. Add your domain (or use the free sandbox domain for dev)
3. Copy **RESEND_API_KEY** (`re_...`)

### 1C. Razorpay
1. dashboard.razorpay.com → Settings → API Keys → Generate
2. Copy **RAZORPAY_KEY_ID** and **RAZORPAY_KEY_SECRET**
3. For test mode use `rzp_test_...` keys

### 1D. Cloudflare R2 (media storage — cheaper than S3)
1. dash.cloudflare.com → R2 → Create Bucket: `origo-media`
2. Manage API Tokens → Create Token with R2 permissions
3. Get: **Account ID**, **Access Key ID**, **Secret Access Key**
4. Bucket public URL: `https://pub-<hash>.r2.dev` or custom domain

### 1E. Firebase (push notifications)
1. console.firebase.google.com → New project → Android app
2. Package name: `app.origo.android`
3. Download `google-services.json` → place in `origo-app/`
4. Project Settings → Service Accounts → Generate private key → JSON
5. Copy JSON content → **FIREBASE_SERVICE_ACCOUNT_JSON**

---

## STEP 2 — Backend on Railway

Railway is the easiest production-grade host for Node.js + PostgreSQL.

### 2A. Create project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From backend/ directory:
cd backend
railway init        # creates new Railway project
railway link        # links to project
```

### 2B. Add PostgreSQL database
Railway dashboard → your project → + New → Database → PostgreSQL
- Copy the **DATABASE_URL** from the Variables tab

### 2C. Run Prisma migrations
```bash
# In backend/, set local DATABASE_URL first:
export DATABASE_URL="postgresql://..."

npm run db:migrate   # runs: prisma migrate deploy
npm run db:seed      # seeds interest categories
```

### 2D. Set environment variables
Railway dashboard → Variables → Add all of these:

```
DATABASE_URL           = (from Railway PostgreSQL)
REDIS_URL              = (from Upstash)
JWT_SECRET             = (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET     = (same command, different value)
FIELD_ENCRYPTION_KEY   = (same command, must be 32 bytes = 64 hex chars)
RESEND_API_KEY         = re_...
RAZORPAY_KEY_ID        = rzp_live_...
RAZORPAY_KEY_SECRET    = ...
AWS_ACCESS_KEY_ID      = (Cloudflare R2 key)
AWS_SECRET_ACCESS_KEY  = (Cloudflare R2 secret)
AWS_S3_BUCKET          = origo-media
AWS_REGION             = auto
AWS_ENDPOINT           = https://<account-id>.r2.cloudflarestorage.com
FIREBASE_SERVICE_ACCOUNT_JSON = {"type":"service_account",...}
FCM_SERVER_KEY         = ...
ALLOWED_ORIGINS        = https://origo.app,https://www.origo.app
NODE_ENV               = production
PORT                   = 4000
```

### 2E. Deploy
```bash
cd backend
railway up          # deploys current code

# Or connect GitHub for auto-deploy on push:
# Railway dashboard → Settings → GitHub repo → select ORIGO_app_website → branch: main
# Build command: npm install && npx prisma generate
# Start command: npm start
```

### 2F. Get your backend URL
Railway dashboard → Settings → Domain → Generate domain
Example: `https://origo-backend-production.up.railway.app`

Save this as `BACKEND_URL` — you'll need it for the app.

### 2G. Razorpay webhook
Razorpay dashboard → Webhooks → Add:
- URL: `https://your-railway-url.railway.app/v1/payments/webhook`
- Events: `payment.captured`, `subscription.cancelled`, `subscription.halted`
- Secret: generate one and add to Railway as `RAZORPAY_WEBHOOK_SECRET`

---

## STEP 3 — Website on Vercel

### 3A. Deploy
1. vercel.com → Import → GitHub → ORIGO_app_website repo
2. Root Directory: `origo-web`
3. Framework Preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click Deploy

### 3B. Custom domain
Vercel dashboard → Domains → Add → `origo.app`
Add DNS records at your registrar:
```
A     @        76.76.21.21
CNAME www      cname.vercel-dns.com
```

### 3C. Environment variables (website has none required for MVP)
The marketing website is fully static — no env vars needed.

---

## STEP 4 — Android App with EAS Build

Expo Application Services (EAS) builds a signed APK/AAB for Google Play.

### 4A. Setup EAS
```bash
# Install EAS CLI globally
npm install -g eas-cli

cd origo-app

# Login to Expo account (create one at expo.dev)
eas login

# Initialize EAS in project
eas build:configure
```

### 4B. Create `eas.json`
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4C. Set app environment variables
Create `origo-app/.env.production`:
```
EXPO_PUBLIC_API_URL=https://your-railway-url.railway.app/v1
```

### 4D. Build APK (for testing)
```bash
cd origo-app

# Internal test APK (download directly)
eas build --platform android --profile preview

# When done, EAS prints a download URL for the .apk
```

### 4E. Build for Google Play (AAB)
```bash
# Production bundle (AAB for Play Store)
eas build --platform android --profile production
```

### 4F. Submit to Google Play
1. Google Play Console → Create app → `Origo`
2. Package name: `app.origo.android`
3. Internal testing → Upload the .aab from EAS
4. Required before publishing:
   - Privacy policy URL (host on your website)
   - App screenshots (minimum 2 phone screenshots)
   - Feature graphic (1024×500 px)
   - Short description (80 chars): "Campus-first social app with verified identity & Rizz In 5"

```bash
# Or use EAS to submit directly:
eas submit --platform android --profile production
```

---

## STEP 5 — Push Notifications (FCM)

The backend already sends push via Expo Push API. For production:

1. expo.dev → your project → Credentials → Android → FCM V1 Service Account Key → Upload `google-services.json`
2. Backend already uses `https://exp.host/--/api/v2/push/send` — no extra setup
3. Test: Register device, call `POST /v1/users/me/push-token` with Expo push token from app

---

## STEP 6 — Production Checklist

Before going live, verify:

```
Backend
[ ] DATABASE_URL points to production Railway PostgreSQL
[ ] All env vars set in Railway
[ ] npm run db:migrate ran successfully
[ ] npm run db:seed ran (interests seeded)
[ ] /health endpoint returns 200
[ ] Socket.io connects (test with wscat or Postman)
[ ] Razorpay webhook configured

Website
[ ] Vercel deployment successful
[ ] Custom domain HTTPS working
[ ] All pages load (/, /features, /about, /download)

App
[ ] EXPO_PUBLIC_API_URL points to Railway backend
[ ] google-services.json in project root
[ ] Push notifications working on real device
[ ] Razorpay test payment completes successfully
[ ] EAS build succeeds
[ ] AAB uploaded to Google Play internal track
```

---

## STEP 7 — Monitoring & Logs

### Railway logs
```bash
railway logs --tail    # live logs
```

### Database queries (via Prisma Studio)
```bash
cd backend
npx prisma studio      # opens browser UI at localhost:5555
```

### Upstash Redis dashboard
- View key counts, memory usage, latency at console.upstash.com

---

## Cost Estimates (MVP stage)

| Service | Plan | Monthly Cost |
|---|---|---|
| Railway (backend + DB) | Hobby | ~$5-10 |
| Upstash Redis | Free | $0 |
| Vercel (website) | Hobby | $0 |
| Cloudflare R2 (10GB) | Free | $0 |
| Expo EAS Build | Free tier (30 builds/mo) | $0 |
| Resend (3000 emails/mo) | Free | $0 |
| Razorpay | 2% per transaction | Pay-per-use |
| **Total** | | **~₹800-1500/month** |

Upgrade path: As users grow, switch to Railway Pro ($20/mo) + dedicated DB.

---

## Environment Variable Quick Reference

### Generate secrets (run once):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this 3 times — one for each of: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`

### Cloudflare R2 as S3-compatible storage:
Set `AWS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com` and `AWS_REGION=auto` in addition to normal AWS_* keys.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `ECONNREFUSED` on DB | Check DATABASE_URL format: `postgresql://user:pass@host:5432/db` |
| Redis `NOAUTH` | Add password to REDIS_URL: `rediss://:password@host:6379` |
| Prisma schema not found | Run from `backend/` dir, not root |
| EAS build fails: no credentials | Run `eas credentials` to generate keystore |
| App 401 on all requests | Check EXPO_PUBLIC_API_URL ends with `/v1` (no trailing slash) |
| Push not delivered | Verify FCM service account uploaded to expo.dev credentials |
| Razorpay signature mismatch | Ensure RAZORPAY_KEY_SECRET matches live/test mode of order |
