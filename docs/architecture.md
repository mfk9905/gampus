# UNILIVE V2 — System Architecture & Product Blueprint

## 1. Overview
UNILIVE is an end-to-end student relocation and campus marketplace platform designed specifically for university students in Turkey. 

### Core User Journey:
1. **Freshman Arrival**: Select University -> Find Rental House / Room -> Find Roommate -> Buy Secondhand Furniture -> Move In.
2. **Senior Graduation**: Create Handover Passport (Ev Devri) -> Sell Furniture Packages -> Hand over home to incoming student.

---

## 2. Technology Stack
- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Database & ORM**: Prisma ORM with SQLite (`dev.db`)
- **Authentication**: JWT + HttpOnly SameSite Lax Cookie (`unilive_token`)
- **Design System**: Moduler Vanilla CSS + Tailwind-compatible Design System
- **Validation**: Zod schema validation on API & UI forms

---

## 3. Directory & Module Structure
```text
src/
 ├── app/                  # App Router pages and API endpoints
 ├── components/           # UI components (Navbar, Footer, ListingCard, etc.)
 ├── config/               # System constants (Premium pricing, Suspicious keywords)
 ├── lib/
 │   ├── auth/             # JWT creation, cookie handling, rate limiting
 │   ├── db/               # Prisma client singleton
 │   └── validation/       # Zod schemas for register, login, listing, reviews
 └── services/             # Business logic layer
     ├── listing-service.ts
     ├── moderation-service.ts
     ├── notification-service.ts
     ├── payment-service.ts
     ├── trust-score-service.ts
     └── matchmaking-service.ts
```
