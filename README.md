<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=FF6B35&height=200&section=header&text=RAPIDE&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Plateforme%20de%20Livraison%20Premium%20au%20Bénin&descAlignY=60&descSize=18" width="100%" />

[![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

**Modern · Premium · Multilingual**

*La plateforme de livraison de référence pour le Bénin — French-first, English supported*

</div>

---

## Overview

Rapide is a full-featured, production-ready delivery platform built specifically for the Beninese market. It connects customers, delivery drivers, and businesses in real time — with a premium mobile-first UI, bilingual support (FR/EN), and a complete backend powering everything from dynamic pricing to wallet transactions.

**Core stack:** Next.js 14 · Node.js + Express · PostgreSQL 16 · Prisma ORM · Socket.IO · Redis · TypeScript throughout

---

## Architecture

```
rapide/
├── backend/                        # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma           # 20+ model schema
│   │   └── seed.ts                 # Seed data
│   └── src/
│       ├── config/                 # DB, JWT, Logger
│       ├── middleware/             # Auth, Error handler
│       ├── modules/
│       │   ├── auth/               # Register · Login · JWT refresh
│       │   ├── orders/             # Full order lifecycle
│       │   ├── drivers/            # Profiles · Documents · Earnings
│       │   ├── admin/              # Full admin panel API
│       │   ├── payments/           # Wallet · Transactions
│       │   ├── pricing/            # Dynamic pricing engine
│       │   ├── tracking/           # Real-time GPS
│       │   ├── notifications/      # Bilingual push notifications
│       │   ├── support/            # Tickets & messages
│       │   ├── businesses/         # Vendor management
│       │   └── users/              # Saved addresses
│       └── services/
│           ├── socket.service.ts   # Socket.IO real-time layer
│           ├── pricing.service.ts  # Pricing engine
│           └── upload.service.ts   # File uploads
│
├── frontend/                       # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx                       # Marketing landing
│       │   ├── (auth)/login/                  # Login
│       │   ├── (auth)/register/               # Registration (customer / driver)
│       │   ├── (customer)/dashboard/          # Customer app
│       │   │   ├── orders/new/                # 4-step order flow
│       │   │   ├── tracking/[orderId]/        # Live GPS tracking
│       │   │   └── wallet/                    # Wallet & transactions
│       │   ├── (driver)/driver/dashboard/     # Driver app
│       │   └── (admin)/admin/                 # Admin dashboard
│       │       ├── drivers/                   # Approve / reject
│       │       ├── orders/                    # Order management
│       │       └── pricing/                   # Pricing config
│       ├── lib/
│       │   ├── api.ts              # Typed Axios client + auto token refresh
│       │   └── utils.ts            # Currency · Date · Status helpers
│       ├── stores/
│       │   ├── auth.store.ts       # Zustand auth (persisted)
│       │   └── lang.store.ts       # FR/EN language switcher
│       ├── hooks/
│       │   └── useSocket.ts        # Socket.IO singleton hook
│       └── locales/
│           ├── fr/common.json      # French translations (complete)
│           └── en/common.json      # English translations (complete)
│
├── docker-compose.yml              # PostgreSQL + Redis
└── package.json                    # npm workspaces monorepo
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Docker Desktop | Latest |
| Git | Any recent |

### 1 — Clone and install

```bash
git clone https://github.com/OGANONYMOU/RAPIDE.git
cd RAPIDE
npm install
```

### 2 — Start databases

```bash
docker compose up -d
```

Starts **PostgreSQL** on `localhost:5432` and **Redis** on `localhost:6379`.

### 3 — Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**`backend/.env`**
```env
DATABASE_URL="postgresql://rapide_user:rapide_password@localhost:5432/rapide"
JWT_SECRET=your_strong_secret_here
JWT_REFRESH_SECRET=another_strong_secret_here
```

**`frontend/.env.local`**
```env
BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### 4 — Migrate and seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### 5 — Run

```bash
# Both frontend + backend from root
npm run dev

# Individually
npm run dev:backend
npm run dev:frontend
```

### 6 — Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| API Health | http://localhost:4000/health |
| Prisma Studio | `cd backend && npx prisma studio` |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@rapide.bj | Admin@Rapide2024 |
| Customer | client@example.com | Customer@123 |
| Driver | driver@example.com | Driver@123 |

---

## Features

<details>
<summary><strong>Platform</strong></summary>

- French-first multilingual UI with in-app FR/EN switching
- Mobile-first premium responsive design
- JWT authentication with silent auto-refresh
- Role-based access control (Customer · Driver · Admin · Super Admin)
- Real-time Socket.IO for tracking, updates, and in-app chat

</details>

<details>
<summary><strong>Customer App</strong></summary>

- 4-step order creation (addresses → package → options → payment)
- Dynamic price estimation before confirming
- Live GPS tracking page per order
- Order history and status timeline
- Wallet: top-up, balance, transaction history
- In-order chat with assigned driver
- Delivery ratings
- Promo code support
- Saved addresses management

</details>

<details>
<summary><strong>Driver App</strong></summary>

- Registration with vehicle type selection
- Document upload (ID, license, insurance)
- Admin approval flow before activation
- Online/offline toggle via Socket.IO
- Real-time new-order notifications
- Accept / decline incoming orders
- Earnings dashboard (daily · weekly · monthly)
- Delivery history
- Wallet with automatic earnings credit

</details>

<details>
<summary><strong>Admin Dashboard</strong></summary>

- Stats overview: users, drivers, orders, revenue
- Revenue and order charts (Recharts)
- Driver management with approve/reject actions
- Order management with filtering
- Pricing configuration per vehicle type
- Promo code management
- Support ticket handling
- Content management (banners, FAQs)
- Period-based analytics

</details>

<details>
<summary><strong>Backend</strong></summary>

- 20+ Prisma models (complete schema)
- Dynamic pricing engine: distance + size + vehicle type + urgency + surge
- Haversine distance calculation for accurate estimates
- Wallet system: top-up, debit, credit, driver earnings auto-credit
- Complete order lifecycle management
- Proof of delivery (photo upload)
- Bilingual notification system
- Support ticket system
- Business / vendor management
- Rate limiting, CORS, Helmet security headers

</details>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Real-time | Socket.IO |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |
| Maps | Mapbox GL (configurable) |
| File storage | Local (dev) → S3-compatible (prod) |

---

## Production Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Maps (Mapbox / Google Maps) | Configure | Add API key to `.env.local` |
| Payment gateway | Integrate | FedaPay, MTN MoMo, Moov Money |
| SMS notifications | Integrate | Twilio or local Benin SMS provider |
| Email (SMTP) | Configure | Set `SMTP_*` vars in `backend/.env` |
| Push notifications | Add | Firebase FCM for mobile clients |
| File storage (prod) | Migrate | S3 / Cloudflare R2 |
| SSL / HTTPS | Configure | Required for production deployment |

---

## Production Build

```bash
# Build
cd backend && npm run build
cd frontend && npm run build

# Migrate (production)
cd backend && npm run db:migrate:prod

# Start
cd backend && npm start
cd frontend && npm start
```

---

<div align="center">

Built with care for the **Bénin Republic**

*Rapide Team — Africa's delivery infrastructure, one order at a time.*

</div>
