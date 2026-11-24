# Salon Queue Management System — Project Brief

## Problem
Customers often spend a long time waiting at salons without knowing when their turn will arrive. Staff struggle to manage walk-ins, barber preferences and missed turns fairly. This application provides a shared live queue so customers can plan their arrival and staff can manage service efficiently.

## Users
- Customer: joins remotely and tracks or cancels their spot.
- Receptionist: registers walk-ins, calls customers and handles cancellations/no-shows.
- Barber: views assigned customer, starts/completes service and manages breaks.
- Owner: manages services, staff availability, queue opening and daily statistics.
- Waiting-area visitors: view public token display.

## Must-have features
1. Mobile queue joining with up to three services and a preferred barber or Any.
2. Unique token, live queue position, estimated waiting time and arrival alerts.
3. Reception dashboard with walk-in registration, Call next, Cancel and No-show.
4. Barber view with Start, Done and break controls.
5. Public TV display showing current tokens and next five waiting tokens.
6. Owner settings for services, on-duty barbers, online queue and daily statistics.
7. English/Gujarati interface and responsive design.
8. Shared persistent queue with updates across devices within five seconds under normal connectivity.

## Don't build
Online payments, advance appointments, SMS/WhatsApp, loyalty programmes, multiple branches, native mobile apps or complex analytics.

## Look and feel
Premium salon aesthetic: dark charcoal (#1F2937), gold (#D4A017), warm neutral text, rounded cards, accessible contrast and mobile-first layouts.

## Success criteria
All seven screens work; remote customers and walk-ins share one queue; barber preferences are respected; status updates reach all connected devices; the application is accessible through a deployed link.

## Technology and deployment
React + Vite + Tailwind CSS frontend; Express.js backend; PostgreSQL (Neon) with Prisma; Socket.IO for live updates; JWT and bcrypt for staff authentication. Deploy frontend to Vercel and backend to Render. No MongoDB, Supabase or Firebase.
