# HabitFlow 🚀

> **Private, customizable hourly habit and behavior tracking web app.**  
> Track honestly &rarr; Understand patterns &rarr; Measure improvement &rarr; Improve gradually.

---

## 👥 Ownership & Collaboration Boundaries

This repository is maintained jointly by two developers on separate feature branches:
- **Owner A (This Implementation):** Core Foundation, Database Schema, Drizzle ORM, Authentication & Authorization, Question Management & Outcome Mappings, Spreadsheet Hourly Track Sheet, Basic Dashboard, Shared Calculation Utilities, and Developer Integration Contracts.
- **Owner B:** Advanced Visual Analytics (Daily/Weekly/Monthly/Heatmaps), Hourly Push Notifications & Web Push, Offline PWA & Service Worker.

All shared types, entity schemas, query functions, and calculation utilities are finalized and documented in [`docs/INTEGRATION_CONTRACT.md`](./docs/INTEGRATION_CONTRACT.md).

---

## 🎯 Critical Product Rules

1. **Separation of Raw Answer and Evaluated Outcome:**
   - **Never assume YES means Positive or NO means Negative.**
   - In habit tracking (e.g. avoiding smoking or junk food), answering `Yes` represents a **Negative** outcome, while answering `No` represents a **Positive** outcome.
   - Every answer option has its own configured outcome (`positive`, `negative`, or `neutral`).
2. **Outcome Snapshots (`outcome_snapshot`):**
   - Each entry stores both the raw user input and a snapshot of the evaluated outcome at the time of tracking. Future option reconfigurations never rewrite history.
3. **Unanswered Slots Are Missing Data:**
   - Unanswered time slots are **NEVER** treated as negative results. Denominators are explicit.
4. **Server-Side Authorization:**
   - Strict user-level data isolation is enforced on every database query and mutation.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, React 19)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS v4, Lucide React icons
- **Database:** PostgreSQL dialect with Drizzle ORM
  - Embedded local PostgreSQL (PGlite) automatically active when `DATABASE_URL` is unset (zero external setup required).
  - Production ready for PostgreSQL / Neon simply by setting `DATABASE_URL`.
- **Security:** Scrypt password hashing with unique salts, cryptographically signed HTTP-only cookies, database-backed sessions.

---

## 🚀 Quickstart & Local Setup

Both developer laptops can clone and run immediately:

```bash
# 1. Clone repository
git clone <REPO_URL>
cd HT

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification Commands

```bash
# Run unit & integration test suite (14 automated tests)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/login & signup      # Secure auth flows
│   ├── (app)/track               # Spreadsheet-style hourly Track Sheet
│   ├── (app)/dashboard           # Metrics, outcome counters, time-of-day summary
│   ├── (app)/questions           # Question management & outcome mapping
│   ├── (app)/analytics           # Reserved for Owner B Analytics
│   ├── (app)/insights            # Reserved for Owner B Notifications / PWA
│   ├── (app)/settings            # Tracking hours & user preferences
│   └── api/                      # REST endpoints for auth, questions, entries, settings
├── components/
│   ├── track/                    # TrackSheet, DateNavigator, AnswerDialog, OutcomeBadge
│   ├── questions/                # QuestionList, QuestionFormDialog
│   ├── dashboard/                # SummaryCards, TimeOfDayBreakdown
│   └── layout/                   # Navbar, navigation links
├── lib/
│   ├── auth/                     # Scrypt hashing and session cookie handlers
│   ├── calculations/             # Pure math utilities for completion & outcomes
│   ├── data-access/              # Server-side authorized query layer
│   └── db/                       # Drizzle ORM schema, PGlite, PostgreSQL pool
└── types/                        # Global TypeScript domain models
```
