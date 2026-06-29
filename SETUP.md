# Origo — Complete Setup Guide

## Project Structure

```
ORIGO_start/
├── backend/          Node.js + Express + Prisma + Socket.io
├── origo-app/        React Native (Expo SDK 51) Android + iOS App  
├── origo-web/        React + Vite + Tailwind Marketing Website
└── SETUP.md          This file
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x LTS | nodejs.org |
| pnpm / npm | latest | npm install -g pnpm |
| PostgreSQL | 15+ | Local or Neon.tech (free) |
| Redis | 7+ | Local or Upstash.com (free) |
| Expo CLI | latest | npm install -g expo-cli |
| Android Studio | latest | For Android emulator |

---

## Step 1 — Database Setup

### Option A: Local PostgreSQL
```bash
# Create database
psql -U postgres
CREATE DATABASE origo_db;
\q
```

### Option B: Free Cloud (Recommended for dev)
1. Go to https://neon.tech — free PostgreSQL in cloud
2. Create project → copy the connection string
3. Use that as DATABASE_URL

---

## Step 2 — Redis Setup

### Option A: Local Redis
```bash
# Windows (WSL) or Linux/Mac
redis-server
```

### Option B: Upstash (Free cloud Redis)
1. Go to https://upstash.com
2. Create Redis database (free tier: 10k commands/day)
3. Copy connection string

---

## Step 3 — Backend Setup

```bash
cd backend
npm install
```

### Create .env file:
```bash
cp .env.example .env
```

Fill in your .env:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/origo_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="generate-with: openssl rand -hex 32"
JWT_REFRESH_SECRET="generate-with: openssl rand -hex 32"
FIELD_ENCRYPTION_KEY="generate-with: openssl rand -hex 32"
PORT=3001
ALLOWED_ORIGINS="http://localhost:3000,exp://192.168.x.x:8081"

# Email (get free at resend.com)
RESEND_API_KEY="re_your_key"

# Payments (get at razorpay.com — free test keys)
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="your_secret"

# AWS S3 (or skip for now, file uploads won't work)
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_REGION="ap-south-1"
S3_BUCKET_NAME="origo-media"

# ML service (optional — discovery will return empty without it)
ML_SERVICE_URL="http://localhost:8000"
```

### Run database migrations:
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply schema to database
npx ts-node prisma/seed.ts  # Seed interests + communities
```

### Start backend:
```bash
npm run dev
# Runs on http://localhost:3001
# Test: http://localhost:3001/health
```

---

## Step 4 — Android App Setup

```bash
cd origo-app
npm install
```

### Create .env file:
```bash
echo 'EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3001' > .env
# Replace YOUR_COMPUTER_IP with your local IP (e.g., 192.168.1.5)
# Find your IP: ipconfig (Windows) / ifconfig (Mac/Linux)
```

### Start the app:
```bash
# Option A: Expo Go (scan QR with phone)
npx expo start

# Option B: Android Emulator (need Android Studio)
npx expo start --android

# Option C: Build APK for real device
npx expo build:android
```

> **Note**: For physical device testing, phone and computer must be on same WiFi network.

---

## Step 5 — Website Setup

```bash
cd origo-web
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## What's Included

### Backend (Node.js)
- ✅ JWT authentication with refresh token rotation
- ✅ AES-256-GCM field encryption for PII data
- ✅ Prisma ORM with full PostgreSQL schema
- ✅ Redis session management
- ✅ Rate limiting (auth, API, OTP, Rizz)
- ✅ Socket.io for real-time chat
- ✅ Rizz session engine (5-message mechanic)
- ✅ College email OTP verification
- ✅ GDPR-compliant account deletion
- ✅ Background job for Rizz session expiry

### Android App (React Native Expo)
- ✅ Complete onboarding flow (8 screens)
- ✅ Discover/swipe screen with filters
- ✅ Rizz In 5 inbox + chat screens
- ✅ Full chat/conversations screens
- ✅ Communities browser
- ✅ Profile screen
- ✅ Zustand auth store + React Query
- ✅ MMKV secure local storage
- ✅ Axios with auto token refresh

### Website (React + Vite)
- ✅ Landing page with Hero, Features, How It Works, Testimonials, Stats, Premium sections
- ✅ Features detail page
- ✅ About page
- ✅ Download page with FAQ
- ✅ Responsive design
- ✅ Dark theme matching app design system

---

## What You Need to Add / Configure

### Critical (App won't work without these)
| Item | Service | Cost |
|------|---------|------|
| PostgreSQL DB | Neon.tech | Free |
| Redis | Upstash.com | Free |
| JWT secrets | Generate locally | Free |
| Encryption key | Generate locally | Free |

### For Email OTP Verification
| Item | Service | Cost |
|------|---------|------|
| Transactional email | Resend.com | Free (100 emails/day) |

### For File Uploads (Avatars, Student ID)
| Item | Service | Cost |
|------|---------|------|
| Object storage | AWS S3 or Cloudflare R2 | ~$0.02/GB |
| Image moderation | AWS Rekognition | ~$1 per 1000 images |

### For Push Notifications
| Item | Service | Cost |
|------|---------|------|
| Android push | Firebase FCM | Free |
| Expo push | Expo | Free |

### For Payments (Premium)
| Item | Service | Cost |
|------|---------|------|
| Payment gateway | Razorpay | Free (2% per transaction) |

### For ML Compatibility Scoring (Optional)
You need to build or mock the Python FastAPI service at ML_SERVICE_URL.
Without it, discovery will work but won't show compatibility scores.

Minimum mock (add to backend/src/services/discover.service.ts):
The discover service currently calls `ML_SERVICE_URL/recommend` — 
you can stub this to return users from your database directly.

---

## Generate Secure Keys

Run these in terminal to generate secrets:

```bash
# JWT Secret (run twice for two different keys)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# AES-256 Encryption Key (must be exactly 64 hex chars = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Endpoints Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /v1/auth/register | No | Register new user |
| POST | /v1/auth/login | No | Login |
| POST | /v1/auth/refresh | No | Refresh tokens |
| POST | /v1/auth/logout | Yes | Logout |
| POST | /v1/auth/verify-college-email | Yes | Send OTP to college email |
| POST | /v1/auth/confirm-college-otp | Yes | Verify OTP |
| DELETE | /v1/auth/account | Yes | Delete account |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /v1/users/me | Yes | Get own profile |
| PATCH | /v1/users/me | Yes | Update profile |
| PUT | /v1/users/me/interests | Yes | Update interests |
| GET | /v1/users/:id | Yes | Get public profile |

### Rizz
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /v1/rizz/sessions | Yes | Start Rizz session |
| GET | /v1/rizz/sessions | Yes | List sessions |
| GET | /v1/rizz/sessions/:id | Yes | Get session |
| POST | /v1/rizz/sessions/:id/messages | Yes | Send Rizz message |
| POST | /v1/rizz/sessions/:id/decline | Yes | Decline session |
| GET | /v1/rizz/sessions/:id/icebreaker | Yes | Get icebreaker prompt |

---

## Deployment

### Backend — Railway.app (Recommended)
1. Push backend/ to GitHub
2. New project → Deploy from GitHub
3. Add PostgreSQL + Redis plugins
4. Set all env variables
5. Done — auto-deploys on push

### Website — Vercel (Recommended)
1. Push origo-web/ to GitHub
2. Import to Vercel
3. Deploy — free tier, auto HTTPS

### App — Expo EAS Build
```bash
npm install -g eas-cli
eas login
eas build --platform android
# Downloads .apk you can share directly
```

---

## Database Tables Summary

| Table | Purpose |
|-------|---------|
| User | Core user accounts |
| Interest | 44 interest categories |
| UserInterest | User ↔ Interest mappings (max 10) |
| Match | Friend/Date/Study connections |
| RizzSession | 5-message conversation sessions |
| RizzMessage | Individual Rizz messages |
| Conversation | Full chat conversations |
| Message | Chat messages |
| Community | Interest/college communities |
| CommunityMember | User ↔ Community memberships |
| Post | Community posts |
| Comment | Post comments |
| PostLike | Post likes |
| Event | Community events |
| Ship | Ship-a-Friend requests |
| Notification | In-app notifications |
| Subscription | Premium subscriptions |
| ProfileBoost | Paid visibility boosts |
| UserPrivacy | Per-user privacy settings |
| Block | User blocks |
| Report | Content/user reports |
| ConsentLog | GDPR consent records |
| DeletionAuditLog | Account deletion records |

---

## Contact / Support

For questions about this codebase, reach out via the app store listing or GitHub.
