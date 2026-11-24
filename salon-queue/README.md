# Salon Queue Management System

> **Live URL:** _to be added after deployment_
>
> **Backend (Render):** _to be added_
> **Frontend (Vercel):** _to be added_

---

## Overview

A mobile-first, real-time salon queue management system with five roles and seven screens, powered by **React + Vite + Tailwind CSS**, **Express.js**, **PostgreSQL (Neon)** via **Prisma ORM**, and **Socket.IO** for live updates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS · React Router v6 |
| Backend | Node.js · Express.js · Socket.IO |
| Database | PostgreSQL (Neon) · Prisma ORM |
| Auth | JWT · bcrypt |
| Hosting | Vercel (frontend) · Render (backend) · Neon (DB) |

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- A PostgreSQL database (local or Neon)

### 1. Clone & install

```bash
git clone <repo-url>
cd salon-queue

# Backend
cd backend
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install

# Frontend
cd ../frontend
cp .env.example .env      # fill in VITE_API_URL and VITE_SOCKET_URL
npm install
```

### 2. Database setup

```bash
cd backend

# Run migrations (creates all tables + partial unique indexes)
npm run db:migrate

# Seed demo data (barbers, services, staff accounts)
npm run db:seed
```

### 3. Run both apps

```bash
# Terminal 1 — backend (port 4000)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Open: `http://localhost:5173`

---

## Demo Staff Credentials

> These are for demonstration only. **Never publish real credentials.**

| Role | Username | Password | URL |
|---|---|---|---|
| Receptionist | `reception` | `demo1234` | `/reception` |
| Barber (Ravi) | `ravi` | `demo1234` | `/barber/Ravi` |
| Barber (Amit) | `amit` | `demo1234` | `/barber/Amit` |
| Barber (Imran)| `imran` | `demo1234` | `/barber/Imran` |
| Owner | `owner` | `demo1234` | `/admin` |

---

## Screens

| Screen | URL | Auth |
|---|---|---|
| Home | `/` | Public |
| Join Queue | `/join` | Public |
| My Status | `/status/:id` | Public (UUID link) |
| Reception | `/reception` | Reception / Owner |
| Barber View | `/barber/:name` | Barber (own) / Owner |
| Waiting Area TV | `/display` | Public |
| Owner Settings | `/admin` | Owner only |

---

## Environment Variables

### `backend/.env`
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=8h
PORT=4000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

---

## Available Scripts

### Backend
```bash
npm run dev              # Start dev server with nodemon
npm run start            # Production start
npm run db:migrate       # Run Prisma migrations
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:generate      # Regenerate Prisma client
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset DB (dev only)
```

### Frontend
```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Deployment

### Backend (Render)
1. Create a new **Web Service** on Render
2. Set build command: `npm install && npm run db:migrate:deploy && npm run db:generate`
3. Set start command: `npm run start`
4. Add environment variables from `.env.example`

### Frontend (Vercel)
1. Import the `frontend/` directory
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add `VITE_API_URL` and `VITE_SOCKET_URL` pointing to your Render URL

### Database (Neon)
1. Create a free Neon project
2. Copy the connection string to `DATABASE_URL`
