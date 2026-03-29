# Rapide — Plateforme de Livraison Premium au Bénin

> Plateforme de livraison moderne, premium et multilingue pour le Bénin (French-first, English support).
> Stack: **Next.js 14 · Node.js + Express · PostgreSQL · Prisma · Socket.IO**

---

## 📦 Architecture

```
rapide/
├── backend/                  # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Full database schema (20+ models)
│   │   └── seed.ts           # Initial data seed
│   └── src/
│       ├── config/           # DB, JWT, Logger
│       ├── middleware/        # Auth, Error handler
│       ├── modules/          # Feature modules
│       │   ├── auth/         # Register, Login, JWT refresh
│       │   ├── orders/       # Full order lifecycle
│       │   ├── drivers/      # Driver profile, docs, earnings
│       │   ├── admin/        # Full admin panel API
│       │   ├── payments/     # Wallet, transactions
│       │   ├── pricing/      # Dynamic pricing engine
│       │   ├── tracking/     # Real-time GPS tracking
│       │   ├── notifications/# Localized notifications
│       │   ├── support/      # Tickets & messages
│       │   ├── businesses/   # Vendor management
│       │   └── users/        # Saved addresses
│       └── services/
│           ├── socket.service.ts   # Socket.IO real-time
│           ├── pricing.service.ts  # Pricing engine
│           └── upload.service.ts   # File uploads
│
├── frontend/                 # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Marketing landing
│       │   ├── (auth)/login/               # Login page
│       │   ├── (auth)/register/            # Registration (customer/driver)
│       │   ├── (customer)/dashboard/       # Customer app
│       │   │   ├── page.tsx                # Dashboard home
│       │   │   ├── orders/new/             # New order flow (4 steps)
│       │   │   ├── tracking/[orderId]/     # Live tracking
│       │   │   └── wallet/                 # Wallet & transactions
│       │   ├── (driver)/driver/dashboard/  # Driver app
│       │   └── (admin)/admin/              # Admin dashboard
│       │       ├── page.tsx                # Stats + charts
│       │       ├── drivers/                # Approve/reject drivers
│       │       ├── orders/                 # Order management
│       │       └── pricing/               # Pricing configuration
│       ├── lib/
│       │   ├── api.ts          # Typed API client (Axios + auto-refresh)
│       │   └── utils.ts        # Helpers (currency, date, status colors)
│       ├── stores/
│       │   ├── auth.store.ts   # Zustand auth (persisted)
│       │   └── lang.store.ts   # Language switching FR/EN
│       ├── hooks/
│       │   └── useSocket.ts    # Socket.IO singleton hook
│       └── locales/
│           ├── fr/common.json  # French translations (full)
│           └── en/common.json  # English translations (full)
│
├── docker-compose.yml        # PostgreSQL + Redis
└── package.json              # npm workspaces monorepo
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** 18+
- **Docker Desktop** (for PostgreSQL + Redis)
- **Git**

---

### 1. Clone and install

```bash
git clone https://github.com/your-org/rapide.git
cd rapide
npm install
```

---

### 2. Start databases

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

---

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://rapide_user:rapide_password@localhost:5432/rapide"
JWT_SECRET=change_this_to_a_strong_secret_in_production
JWT_REFRESH_SECRET=change_this_too
```

Edit `frontend/.env.local`:
```env
BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

`BACKEND_URL` lets the Next.js app proxy API requests to the backend, so the frontend can use the shared `/api/*` path by default while both apps still run from the repo root with one command.

---

### 4. Run database migrations and seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

---

### 5. Start development servers

```bash
# From root — starts both frontend + backend
npm run dev
```

Or individually:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

---

### 6. Access the app

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **API Health** | http://localhost:4000/health |
| **Prisma Studio** | `cd backend && npx prisma studio` |

---

### Demo Accounts (from seed)

| Role | Email | Password |
|---|---|---|
| **Super Admin** | admin@rapide.bj | Admin@Rapide2024 |
| **Customer** | client@example.com | Customer@123 |
| **Driver** | driver@example.com | Driver@123 |

---

## ✅ Features Implemented

### Platform
- [x] French-first multilingual (FR/EN switching in-app)
- [x] Mobile-first responsive design (premium UI)
- [x] JWT auth with auto-refresh tokens
- [x] Role-based access (Customer, Driver, Admin, Super Admin)
- [x] Real-time Socket.IO (live tracking, order updates, chat)

### Customer App
- [x] Registration & login
- [x] 4-step order creation (addresses → package → options → payment)
- [x] Dynamic price estimation
- [x] Order history & status tracking
- [x] Live GPS tracking page
- [x] Wallet (top-up, balance, transactions)
- [x] Order chat with driver
- [x] Delivery ratings
- [x] Promo code support
- [x] Saved addresses

### Driver App
- [x] Registration with vehicle type
- [x] Document upload (ID, license, insurance)
- [x] Admin approval flow (not auto-activated)
- [x] Go online/offline toggle (Socket.IO)
- [x] Real-time new order notifications
- [x] Accept/decline orders
- [x] Earnings dashboard (daily/weekly/monthly)
- [x] Delivery history
- [x] Wallet with earnings auto-credit

### Admin Dashboard
- [x] Stats overview (users, drivers, orders, revenue)
- [x] Revenue + order charts (Recharts)
- [x] Driver management with approve/reject
- [x] Order management with filtering
- [x] Pricing configuration per vehicle type
- [x] Promo code management
- [x] Support ticket management
- [x] Content management (banners, FAQs)
- [x] Analytics (period-based)

### Backend
- [x] 20+ Prisma models (complete schema)
- [x] Dynamic pricing engine (distance + size + vehicle + urgency + surge)
- [x] Haversine distance calculation
- [x] Wallet system (top-up, debit, credit, earnings)
- [x] Order lifecycle management
- [x] Proof of delivery (photo upload)
- [x] Notification system (bilingual)
- [x] Support ticket system
- [x] Business/vendor management
- [x] Rate limiting, CORS, Helmet security

---

## 🔧 Integration Checklist for Production

| Feature | Status | Notes |
|---|---|---|
| Maps (Google Maps / Mapbox) | 🔲 Configure | Add your API key to `.env.local` |
| Payment gateway | 🔲 Integrate | FedaPay, MTN MoMo, Moov for Benin |
| SMS notifications | 🔲 Integrate | Twilio or local Benin SMS provider |
| Email (SMTP) | 🔲 Configure | Set SMTP_* vars in `backend/.env` |
| Push notifications | 🔲 Add | Firebase FCM for mobile |
| File storage (prod) | 🔲 Migrate | Use S3 / Cloudflare R2 in production |
| SSL / HTTPS | 🔲 Configure | Required for production |

---

## 🏗️ Production Deployment

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Run database migrations (production)
cd backend && npm run db:migrate:prod

# Start services
cd backend && npm start
cd frontend && npm start
```

---

## 💡 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL 16 |
| Real-time | Socket.IO |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |
| UI | Custom design system (no external component lib dependency) |
| Maps | Mapbox GL (configurable) |
| File storage | Local (dev) → S3 compatible (prod) |
| Cache/Sessions | Redis |

---

*Built with ❤️ for the Bénin Republic — Rapide Team*
