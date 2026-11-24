# AGENTS.md — Salon Queue Management System
Build a mobile-first salon queue app with customer, reception, barber, owner and public TV screens.

## Read first
- `docs/01-brief.md`: scope and exclusions.
- `docs/02-screens.md`: screen layouts, actions and states.
- `docs/03-flows-rules.md`: authoritative business rules and acceptance tests.

## Stack
- Frontend: React + Vite + Tailwind CSS + React Router, in `frontend/`.
- Backend: Node.js + Express.js, in `backend/`; REST APIs and Socket.IO for cross-device updates.
- Database: PostgreSQL hosted on Neon, using Prisma ORM. Use migrations, seed scripts and server-side `DATABASE_URL`.
- Staff authentication: JWT, bcrypt password hashes and server-side role checks.
- Hosting: Vercel (frontend), Render (backend), Neon (database).
- Do not use MongoDB, Supabase or Firebase.
- Configure `npm run dev` for each app; document install, migration, seed and build commands. Use `.env.example` for both apps and never commit secrets.
- Local storage is permitted for language preference, not shared queue data. Explain the implementation plan before coding.

## Working rules
- Implement only the requested build step. Read relevant docs before editing; ask about genuine conflicts before changing scope.
- Keep charcoal (#1F2937) and gold (#D4A017), responsive layouts and accessible touch targets.
- Put UI labels and messages in EN/GU translation dictionaries.
- Centralize queue logic; enforce critical rules atomically in shared storage. Do not duplicate calculations across screens.
- Protect staff actions and customer details; never commit credentials or privileged keys. Document environment variables using `.env.example`.
- Do not implement excluded features or change unrelated screens.
- After every task, report changed files, how to run/test, actual test results and remaining issues. Never fabricate test results or live URLs.
- Keep docs aligned with approved changes. Run build and relevant tests before suggesting a commit.
- README must contain real live URL immediately after title, hosting details and demo-only staff login instructions. Do not publish real credentials.
