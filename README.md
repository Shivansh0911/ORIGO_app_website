# Origo — Campus-First Social App

> The social layer for Indian college students.  
> Verified identity. Interest-based discovery. Real connections.

---

## What is Origo?

Origo is a campus-first social platform where students connect through shared vibes, not algorithms. Features include:

- **Verified Student Identity** — college email OTP + student ID upload
- **Interest-Based Discovery** — ML compatibility scoring across 30+ interest categories
- **Rizz In 5** — a 5-message first-impression mechanic before full chat unlocks
- **Communities** — interest-based campus forums with posts, comments, and events
- **Ship-a-Friend** — send a secret match suggestion for two friends
- **Origo Premium** — profile boosts, extended Rizz sessions, cross-campus discovery
- **Razorpay Payments** — INR subscriptions (₹99/mo · ₹249/quarter · ₹799/year)
- **Real-time Chat** — Socket.io powered conversations with typing indicators

---

## Monorepo Structure

```
ORIGO_start/
├── backend/          # Node.js + Express + TypeScript API
├── origo-app/        # React Native + Expo (Android)
└── origo-web/        # React + Vite marketing website
```

---

## Tech Stack

### Backend (`backend/`)
| Layer | Tech |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| ORM | Prisma + PostgreSQL |
| Cache / Sessions | Redis (Upstash / ioredis) |
| Real-time | Socket.io |
| Auth | Firebase Auth + custom JWT (access 15m / refresh 30d) |
| Storage | AWS S3 / Cloudflare R2 |
| Payments | Razorpay |
| Email | Resend |
| Push | Expo Push API + FCM |
| PII Encryption | AES-256-GCM |

### Mobile App (`origo-app/`)
| Layer | Tech |
|---|---|
| Framework | React Native 0.74 + Expo SDK 51 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v6 |
| State | Zustand + TanStack React Query v5 |
| Storage | react-native-mmkv |
| Real-time | socket.io-client |

### Website (`origo-web/`)
| Layer | Tech |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS |
| Language | TypeScript |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis instance (local or Upstash)
- Yarn (for the mobile app)

---

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npm run db:migrate     # run Prisma migrations
npm run db:seed        # seed interest categories
npm run dev            # starts on port 4000
```

**Required `.env` variables:**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/origo
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate with openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate with openssl rand -hex 32>
FIELD_ENCRYPTION_KEY=<generate with openssl rand -hex 32>
RESEND_API_KEY=re_...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=origo-uploads
AWS_REGION=ap-south-1
FIREBASE_SERVICE_ACCOUNT_JSON='{...}'
FCM_SERVER_KEY=...
NODE_ENV=development
```

---

### 2. Mobile App

```bash
cd origo-app
yarn install
```

Create `origo-app/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/v1
```

```bash
yarn start          # Metro bundler on :8081
# scan QR with Expo Go, or:
yarn android        # launch on connected device / emulator
```

---

### 3. Website

```bash
cd origo-web
npm install
npm run dev         # dev server on :3000
npm run build       # production build → dist/
```

---

## API Overview

All endpoints are prefixed `/v1/`.

| Group | Prefix | Highlights |
|---|---|---|
| Auth | `/auth` | register, login, OTP verify, refresh, logout |
| Users | `/users` | profile, interests, block, report |
| Discover | `/discover` | paginated people with compatibility scores |
| Rizz | `/rizz` | start/send/decline sessions, icebreakers |
| Matches | `/matches` | send, respond, unmatch |
| Conversations | `/conversations` | list, messages, mark-read |
| Communities | `/communities` | list, join, posts, likes, comments |
| Notifications | `/notifications` | list, mark-read, unread count |
| Payments | `/payments` | Razorpay order creation & webhook verify |

---

## Database Schema

Key models in `backend/prisma/schema.prisma`:

- **User** — core profile, PII encrypted (phone, email, DOB)
- **Interest / UserInterest** — many-to-many with category + emoji
- **Match** — directional with status (PENDING → ACCEPTED / DECLINED)
- **RizzSession / RizzMessage** — 5-message first-impression flow
- **Conversation / Message** — full chat after match
- **Community / Post / Comment** — campus forums
- **Subscription / ProfileBoost** — premium features
- **Notification** — in-app + push
- **Block / Report / ConsentLog / DeletionAuditLog** — trust & safety

---

## Design System

| Token | Value |
|---|---|
| Background | `#0D0D14` |
| Card | `#1A1A2E` |
| Primary | `#6C3DFF` |
| Accent | `#FF6B9D` |
| Border | `#2A2A45` |
| Text | `#FFFFFF` / `#A0A0C0` |

---

## Deployment Checklist

- [ ] Set all production env vars
- [ ] Run `npm run db:migrate` against prod DB
- [ ] Upload app to Google Play (internal testing first)
- [ ] Deploy website to Vercel / Cloudflare Pages
- [ ] Deploy backend to Railway / Render / EC2
- [ ] Configure Razorpay webhook URL → `POST /v1/payments/webhook`
- [ ] Add FCM server key + Expo project ID for push notifications
- [ ] Set up Redis (Upstash recommended for serverless-friendly billing)

---

## License

Private — all rights reserved. Origo © 2025.
