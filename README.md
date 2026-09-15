# ChargeConnect

**Find. Reserve. Charge. Share.**

ChargeConnect is a responsive community EV charging availability platform built for a hackathon demo. It combines public stations, community-shared chargers, transparent availability, reservations, and trust/reporting in one product flow.

## What works

- Premium responsive React UI: landing, sign-in, map discovery, details, booking confirmation, reservations, profile
- Interactive Leaflet / OpenStreetMap discovery map with availability-aware markers and filters
- Demo login personas: Driver, Charger Owner, and Admin
- Server-enforced reservation capacity checks and cancellation
- Community charger publishing; owner availability simulation controls clearly labelled as prototype-only
- Reviews, issue reports, owner hub, and admin verification / report moderation
- Stateful seeded local demo API — no chargers, hardware, account, or Supabase credentials required for the presentation

## Stack

- Client: React, TypeScript, Vite, React Router, Leaflet / React Leaflet, Lucide
- API: Node.js, Express, TypeScript, Zod
- Production-ready data foundation: Supabase PostgreSQL migration and RLS schema

## Structure

```text
client/src/       React pages, feature modules, reusable UI and map components
server/src/       Express API, demo store, seed data and business services
supabase/         PostgreSQL schema migration for Supabase deployment
```

## Run locally

Use Node 20+ and pnpm.

```bash
pnpm install
pnpm --dir server dev
pnpm --dir client dev
```

Open `http://localhost:5173`. The API defaults to `http://localhost:4000`.

## Demo walkthrough

1. Open the landing page and select **Find a charger**.
2. Choose **EV driver** demo persona.
3. Discover nearby seeded stations, open CAET Main Charging Hub, and reserve a slot.
4. View the reservation confirmation and My Reservations.
5. Sign out and choose **Charger owner** to publish a community charger and use the clearly labelled simulation controls.
6. Sign out and choose **Platform admin** to verify listings and resolve reports.

Availability simulation represents application state only; it is not physical charger telemetry or OCPP integration.

## Environment

Copy `.env.example` to `.env`. `DEMO_MODE=true` is the default and requires no credentials. For a production deployment configure the Supabase values and apply `supabase/migrations/001_initial_schema.sql`.

## Team-ready areas

- **Mahesh:** Supabase repository adapter, Auth integration, database tests
- **Mythrayane:** Map/filter improvements, directions UX, favorites and mobile polish
- **Madhushree:** Owner/admin dashboards, notifications, moderation workflow and QA

## Known prototype limits

The demo store resets when the API restarts. Community listing auto-publication and availability simulation exist only for the hackathon demo. Real payments, hardware communication, and production Supabase adapter are intentionally out of scope.
