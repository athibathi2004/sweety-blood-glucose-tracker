# Sweety — Blood Glucose Tracking Application

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-68%20Passing-success.svg)](https://jestjs.io/)

**Sweety** is a production-quality, full-stack healthcare web application designed for patients to log, track, and analyze blood glucose levels across their daily fasting and post-meal routine. Built as part of the Kenpath technical hiring assessment, the system prioritizes clean architecture, mathematical and date-boundary precision, strict data isolation, and a premium healthcare SaaS user interface.

---

## 1. Main Application Features

### 🔐 Secure Authentication & Session Management
- **Registration & Login**: Secure account creation with bcrypt password hashing (12 salt rounds), email normalization (trim and lowercase), and duplicate prevention.
- **HttpOnly Cookies**: Session tokens are transmitted via tamper-proof, client-inaccessible `HttpOnly` cookies (`SameSite: Lax`, `Secure` in production).
- **Server-Side Session Invalidation**: Instant logout invalidates tokens immediately by incrementing a persistent `tokenVersion` in PostgreSQL, preventing replay of unexpired JWTs.
- **Route Protection**: Automated redirects for authenticated vs. unauthenticated users in React Router.

### 🩸 Blood Glucose Reading Management (CRUD)
- **Four Permitted Meal Slots**:
  - `MORNING` — Morning (fasting)
  - `AFTER_BREAKFAST` — After breakfast
  - `AFTER_LUNCH` — After lunch
  - `AFTER_DINNER` — After dinner
- **Strict Invariant Validation**:
  - Whole numbers only between `40` and `600` mg/dl.
  - Maximum of **one reading per slot per day**.
  - Maximum of **four readings per calendar day**.
  - Strict **future-date rejection** (`Date cannot be in the future.`).
- **Data Isolation**: Multi-user isolation where all query filters enforce `userId = req.user.id`. Unauthorized access returns generic 404s without disclosing resource existence.
- **Full History & Filtering**: Filter readings by exact calendar date, month (`YYYY-MM`), or meal time slot.

### 📊 Accurate Analytics & Reports
- **Daily Report**:
  - Highest, lowest, and average glucose levels for the selected day.
  - Chronologically sorted meal slot readings (Morning $\to$ After breakfast $\to$ After lunch $\to$ After dinner).
- **Month-to-Date (MTD) Report**:
  - Date boundaries: Day 1 of the selected month through the selected date inclusive.
  - Overall average computed directly from all individual readings in the range (not an average of daily averages).
  - Daily trend visualization using Recharts.
- **Previous-Month Report**:
  - Date boundaries: Full calendar month immediately preceding the selected date.
  - Seamless January year transitions (e.g., January 2026 accurately evaluates December 1 to December 31, 2025).
  - Leap-year aware (February 29 vs 28).
- **Zero-Reading Protection**: Empty reports display clean empty states and `null` statistics without misleading fake zeros.

---

## 2. Technology Stack

### Frontend (`client/`)
- **Core Framework**: React 18, Vite 6, TypeScript (strict mode)
- **State & Data Fetching**: TanStack Query (React Query v5) with automated cache invalidation
- **HTTP Client**: Axios with `withCredentials: true`
- **Routing**: React Router v6
- **Forms & Validation**: React Hook Form with Zod schema resolvers
- **Styling**: Tailwind CSS with custom healthcare semantic palette (mint, lavender, off-white, navy)
- **UI Primitives**: Accessible dialogs, cards, badges, and responsive tables
- **Visualizations**: Recharts (Responsive Line Chart with custom tooltips)
- **Icons**: Lucide React

### Backend (`server/`)
- **Runtime**: Node.js v20+, Express.js, TypeScript (strict mode)
- **ORM & Database**: Prisma ORM v5 with PostgreSQL
- **Authentication**: JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`
- **Validation**: Zod runtime request validation (body, query, params)
- **Security**: Helmet security headers, CORS origin restriction, express-rate-limit
- **Testing**: Jest, Supertest (68 automated integration and unit tests)

---

## 3. Project Directory Structure

```
Sweety/
├── client/                      # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/ui/       # Accessible UI primitives (Button, Card, Badge, Dialog, Input, Label)
│   │   ├── context/             # Authentication React Context & Provider
│   │   ├── features/            # Feature-oriented domain modules
│   │   │   ├── auth/            # LoginPage, RegisterPage
│   │   │   ├── dashboard/       # DashboardStats overview widget
│   │   │   ├── readings/        # ReadingCard, ReadingHistory, ReadingFormModal, DeleteReadingDialog
│   │   │   └── reports/         # ReportsView, ReportSummaryCards, DailyReadingsTable, GlucoseTrendChart
│   │   ├── hooks/               # Custom hooks (useAuth)
│   │   ├── pages/               # Top-level authenticated layout and view orchestration
│   │   ├── services/            # Axios API clients (api, readingApi, reportApi)
│   │   ├── types/               # Frontend TypeScript interfaces & contracts
│   │   ├── App.tsx              # Application route tree
│   │   └── main.tsx             # React DOM root entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                      # Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma database models, constraints, and indexes
│   │   └── seed.ts              # Idempotent demo seed script
│   ├── src/
│   │   ├── config/              # Database connection & Zod environment validation
│   │   ├── controllers/         # HTTP request/response controllers
│   │   ├── middleware/          # requireAuth, validateRequest, errorHandler, notFound
│   │   ├── routes/              # Express REST routes (auth, readings, reports, health)
│   │   ├── services/            # Core business logic (auth, reading, report)
│   │   ├── types/               # Backend interfaces (reading, report, auth)
│   │   ├── utils/               # Timezone-resilient date utility, API response envelope, logger
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.ts               # Express application builder
│   │   └── server.ts            # HTTP server bootstrap
│   ├── package.json
│   └── tsconfig.json
├── docs/                        # Architecture & design documentation
│   └── architecture.md
├── .env.example                 # Root environment template
├── .gitignore                   # Git exclusion rules
├── package.json                 # Monorepo root orchestration scripts
└── README.md                    # Comprehensive technical documentation
```

---

## 4. Prerequisites

Before setting up Sweety, ensure your local environment has:
- **Node.js**: `v20.x` or higher (`v22` / `v24` supported)
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v14` or higher installed and running locally on port `5432`

---

## 5. PostgreSQL Database Setup

### 1. Create Database and Dedicated Role
Using `psql` or pgAdmin, execute the following SQL to create a dedicated application role and database:

```sql
-- Connect to PostgreSQL as superuser (postgres)
-- Create the dedicated non-superuser role
CREATE ROLE sweety_app WITH LOGIN PASSWORD 'admin@123';

-- Grant database creation privileges for local Prisma shadow database migrations
ALTER ROLE sweety_app CREATEDB;

-- Create the application database owned by sweety_app
CREATE DATABASE sweety_db OWNER sweety_app;

-- Grant all privileges on the database to the application role
GRANT ALL PRIVILEGES ON DATABASE sweety_db TO sweety_app;
```

---

## 6. Environment Configuration

### Root & Server Environment Files
Copy the environment template in the project root:

```powershell
# In Windows PowerShell:
Copy-Item .env.example server/.env
```

Ensure `server/.env` contains your actual database credentials and secrets:

```dotenv
# Server Runtime
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (Prisma ORM)
DATABASE_URL="postgresql://sweety_app:admin@123@localhost:5432/sweety_db?schema=public"

# Authentication
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

> **Security Note**: `.env` is strictly excluded in `.gitignore` and must never be committed to source control.

---

## 7. Installation & Setup Instructions

### 1. Install All Dependencies
From the root directory, install dependencies for both `server` and `client`:

```powershell
npm run install:all
```

### 2. Generate Prisma Client & Run Migrations
Generate the Prisma client and apply the schema to PostgreSQL:

```powershell
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate
```

### 3. Seed Demo Data (Required for Evaluation)
Run the idempotent demo seed script:

```powershell
npm run seed
```

---

## 8. Demo Credentials (For Evaluation Only)

The seed script creates a complete evaluation profile preloaded with 182 realistic glucose readings spanning today, the past 14 days, and the entire preceding month:

| Field | Value |
|---|---|
| **URL** | `http://localhost:5173` |
| **Email** | `demo@sweety.app` |
| **Password** | `SweetyDemo@2026` |
| **Account Name** | `Sweety Demo Patient` |

> ⚠️ **Evaluation Notice**: Demo credentials are strictly intended for local demonstration and evaluation. Never use them in production environments.

---

## 9. Starting the Application

Run the backend and frontend development servers in separate terminal windows:

### Terminal 1: Backend Server (Port 5000)
```powershell
npm run dev:server
```
*API will be active at:* `http://localhost:5000/api`

### Terminal 2: Frontend Client (Port 5173)
```powershell
npm run dev:client
```
*Application UI will be accessible at:* `http://localhost:5173`

---

## 10. Running Automated Tests

Sweety includes **68 automated integration and unit tests** executed with Jest and Supertest against the live PostgreSQL database.

Execute all test suites:

```powershell
npm --prefix server test
```

### Test Suite Overview (100% Pass):
1. **`report.controller.test.ts` (15 tests)**: Verifies daily report stats, slot ordering, Month-to-Date inclusive date boundaries, Previous-Month January transition, one-decimal rounding, empty report `null` statistics, multi-user isolation, and future date rejection.
2. **`reading.controller.test.ts` (20 tests)**: Verifies 4-readings/day limit, slot duplicate rejection, integer range checks (40–600 mg/dl), owner-only editing/deletion, date filtering, and concurrency safety.
3. **`auth.controller.test.ts` (12 tests)**: Verifies bcrypt password hashing, generic 401 on bad credentials, HttpOnly session cookie transmission, and server-side token invalidation upon logout.
4. **`date.test.ts` (19 tests)**: Verifies timezone-resilient date utilities, leap-year handling, month boundaries, and UTC date normalization.
5. **`health.controller.test.ts` (2 tests)**: Verifies system health probe and uptime reporting.

---

## 11. Monorepo Quality & Build Verification

Run strict TypeScript type-checks and production builds across both client and server:

```powershell
# Type check both backend and frontend (0 errors)
npm run type-check

# Production build both backend and frontend
npm run build
```

---

## 12. Complete API Specification

All protected endpoints require the `sweety_token` HttpOnly session cookie.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Registers user (`name`, `email`, `password`), hashes password, sets session cookie |
| `POST` | `/api/auth/login` | Authenticates user, verifies password, sets session cookie |
| `POST` | `/api/auth/logout` | Increments `tokenVersion` server-side and clears session cookie |
| `GET` | `/api/auth/me` | Returns profile of currently authenticated user |

### Blood Glucose Readings (`/api/readings`)
| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| `POST` | `/api/readings` | `{ readingDate, timeSlot, glucoseValue }` | Records a new glucose reading (max 1/slot, max 4/day) |
| `GET` | `/api/readings` | `?date=YYYY-MM-DD&month=YYYY-MM&timeSlot=SLOT` | Lists authenticated user's readings sorted by date descending |
| `GET` | `/api/readings/:id` | `params: { id }` | Retrieves a single reading by UUID (owner only) |
| `PUT` | `/api/readings/:id` | `{ readingDate, timeSlot, glucoseValue }` | Updates reading with full business revalidation |
| `DELETE` | `/api/readings/:id` | `params: { id }` | Permanently deletes a reading (owner only) |

### Analytics & Reports (`/api/reports`)
| Method | Endpoint | Query | Description |
|---|---|---|---|
| `GET` | `/api/reports/daily` | `?date=YYYY-MM-DD` | Highest, lowest, average, count, and sorted meal slot readings |
| `GET` | `/api/reports/month-to-date` | `?date=YYYY-MM-DD` | Stats from 1st of month to date, with daily trend points |
| `GET` | `/api/reports/monthly` | `?date=YYYY-MM-DD` | Stats and trends for entire previous calendar month |
| `GET` | `/api/reports/previous-month`| `?date=YYYY-MM-DD` | Alias for `/api/reports/monthly` |

---

## 13. Reporting Calculation Methodology

1. **Individual Reading Aggregation**: Period averages are computed by summing all individual readings in the date range and dividing by the total count:
   $$\text{average} = \frac{\sum_{i=1}^N \text{glucoseValue}_i}{N}$$
   Daily averages are never averaged together to form period summaries.
2. **Rounding**: Rounded to one decimal place using `Math.round(val * 10) / 10`.
3. **Empty Data Integrity**: If count is 0, statistics return `null` (`highest: null, lowest: null, average: null, count: 0`) and the UI renders `—` rather than a fake zero.
4. **Trend Aggregation**: Days with readings aggregate to a daily average for the trend line, while preserving raw measurements in the daily table.

---

## 14. Architecture & Security Overview

### Backend Request Pipeline
```
HTTP Request ──► Helmet & CORS ──► CookieParser ──► RateLimiter ──► requireAuth ──► Zod Validate ──► Controller ──► Service ──► Prisma ORM ──► PostgreSQL
```

- **Database-Level Concurrency Protection**: The PostgreSQL composite unique constraint `@@unique([userId, readingDate, timeSlot])` prevents race conditions. Violations trigger Prisma error `P2002` which the service catches and translates to `HTTP 409 Conflict`.
- **Timezone Drift Resilience**: Dates are stored in PostgreSQL native `DATE` format. Server-side UTC parsing (`parseDateOnly`) prevents daylight saving or local client offset day shifts.
- **Strict User Isolation**: All read, update, delete, and report queries include `where: { userId }` derived exclusively from the verified token.

---

## 15. Known Assumptions & Future Improvements

### Assumptions
- A user belongs to a single personal health profile.
- Glucose values are measured in whole numbers in `mg/dl` units (the clinical standard in the assignment prompt).
- Exactly four fixed mealtime intervals are supported (`Morning`, `After breakfast`, `After lunch`, `After dinner`).

### Future Enhancements
- Export reports to CSV or PDF for clinical consultations.
- Support for alternate units (`mmol/L`) with automatic conversion.
- Continuous glucose monitor (CGM) API integrations.
- Push notifications or daily reminders for unlogged meal slots.

---

## 16. Technical Evaluation Walkthrough

Follow this 2–3 minute demonstration flow:
1. **Login**: Go to `http://localhost:5173/login`, click **Fill Demo Credentials**, and sign in.
2. **Dashboard Overview**: Note the **Month-to-Date Glucose Overview** banner (Average, Peak, Lowest, Total entries) and **Today's Daily Progress** (2 of 4 recorded).
3. **Log a Reading**: Click **Log Reading**, select today's date, pick **After Lunch**, enter `118 mg/dl`, and save. Notice the progress update to "3 of 4 Recorded".
4. **Validation Test**: Try logging another reading for **After Lunch** on today's date; observe the friendly error banner: *"You already have an After lunch reading for this date."*
5. **Edit & Delete**: Click the edit pencil icon on a reading, modify the value, then use the delete icon to remove a test reading with the confirmation dialog.
6. **Analytics & Reports**:
   - Click **Reports** in the top navigation.
   - **Daily**: View today's summary cards and chronological meal slot table.
   - **Month to Date**: View the Recharts trend line chart with interactive hover tooltips showing daily averages and ranges.
   - **Previous Month**: View October 2026 data demonstrating full-month calculations and leap/month-end boundaries.
7. **Logout**: Click **Sign Out** to verify instant session invalidation and redirection to `/login`.
