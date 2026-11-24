# Sweety Architecture & Technical Design

## 1. System Overview

**Sweety** is a full-stack healthcare web application designed to enable diabetic and health-conscious individuals to log, track, and analyze blood glucose readings. The system enforces strict healthcare business invariants—specifically a maximum of four readings per calendar day corresponding to predefined meal and rest intervals—while ensuring zero timezone drift and complete data integrity.

---

## 2. Layered Backend Architecture

The backend strictly follows a decoupled, unidirectional layered pattern:

```
HTTP Request
     │
     ▼
[Express Routes]        ─── Endpoints mapping & HTTP verbs
     │
     ▼
[Validation Middleware] ─── Zod schema parsing & strict validation
     │
     ▼
[Controllers]           ─── HTTP transport, status codes, response formatting
     │
     ▼
[Services]              ─── Pure business logic, calculations, domain invariants
     │
     ▼
[Prisma ORM Client]     ─── Type-safe query construction, transactions
     │
     ▼
[PostgreSQL Database]   ─── Persistent storage with constraints & indexing
```

### Architectural Principles:
1. **Controllers Do Not Contain Business Logic:**
   Controllers only handle parameter extraction, delegating to the appropriate service, and returning standardized JSON responses (`ApiResponse<T>`).
2. **Services Are Transport-Agnostic:**
   Services never reference Express `req` or `res` objects. They accept pure TypeScript types and return domain entities or throw typed `AppError` exceptions.
3. **Fail-Fast Validation:**
   Validation middleware intercepts malformed requests before they reach controller handlers, rejecting with `400 Bad Request` and structured validation issues.
4. **Centralized Error Handling:**
   All errors (synchronous and asynchronous) propagate to the centralized `errorHandler` middleware. Prisma unique constraint violations (`P2002`) map to `409 Conflict`, missing records (`P2025`) map to `404 Not Found`, and unhandled errors return generic messages in production without leaking internal traces or credentials.

---

## 3. Database Design & Integrity

### PostgreSQL Schema & Prisma Model

```prisma
enum TimeSlot {
  MORNING
  AFTER_BREAKFAST
  AFTER_LUNCH
  AFTER_DINNER
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  password     String
  tokenVersion Int       @default(0) @map("token_version")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  readings     Reading[]

  @@map("users")
}

model Reading {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  readingDate  DateTime  @map("reading_date") @db.Date
  timeSlot     TimeSlot  @map("time_slot")
  glucoseValue Int       @map("glucose_value")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, readingDate, timeSlot], name: "unique_user_date_timeslot")
  @@index([userId, readingDate], name: "idx_user_date")
  @@map("readings")
}
```

### Key Healthcare Invariants:
1. **Daily Reading Cap (Max 4 / Day):**
   The composite unique constraint `@@unique([userId, readingDate, timeSlot])` enforces at the database level that a user can record at most one reading per predefined `TimeSlot` per day.
2. **PostgreSQL DATE Column (`@db.Date`):**
   Dates are stored strictly as date-only (`YYYY-MM-DD`) in PostgreSQL, decoupled from UTC clock-time offsets. Our utility `parseDateOnly` and `formatDateOnly` guarantee that dates are not shifted into previous or subsequent days when clients reside in varying timezones (e.g. UTC-8 or UTC+5:30).
3. **Cascade Deletion:**
   Deleting a user automatically cascades to remove their associated readings, ensuring referential integrity and compliance with data minimization requirements.
4. **Targeted Composite Indexing:**
   The composite index `@@index([userId, readingDate])` optimizes daily lookups, Month-To-Date (MTD) queries, and previous-month reporting queries.
5. **Server-Side Session Invalidation (`tokenVersion`):**
   The `token_version` column on `User` enables instant server-side revocation of previously issued JWTs upon logout without introducing bloated session storage infrastructure.

---

## 4. Authentication Architecture & Security

### 1. Strategy & Cookie Security
- **JWT in HttpOnly Cookies:** Authentication tokens are stored strictly in `HttpOnly`, `SameSite=Lax` cookies with `secure: true` in production and `path: '/'`. The frontend JavaScript runtime cannot read the token, immunizing the client from Cross-Site Scripting (XSS) token exfiltration.
- **No Client Token Storage:** Neither `localStorage` nor `sessionStorage` stores JWT tokens.
- **CORS with Credentials:** The backend restricts origins strictly to `CLIENT_URL` with `credentials: true`.

### 2. Session Revocation (Token Versioning)
```
[Client Login]  ──> Server signs JWT with { userId, email, tokenVersion: 0 }
[Protected Req] ──> Middleware verifies JWT signature AND matches payload.tokenVersion === user.tokenVersion
[Client Logout] ──> Server clears cookie AND increments user.tokenVersion (0 -> 1)
[Replay Token]  ──> Middleware blocks previously issued token with 401 SESSION_REVOKED
```

### 3. Rate Limiting & Brute-Force Protection
- Dedicated `authRateLimiter` applies a strict limit of 15 attempts per 15 minutes per IP address on `/api/auth/register` and `/api/auth/login`.

### 4. Password Security
- Hashed using `bcryptjs` with configurable salt rounds (default: 12).
- Zero plaintext password storage.
- Password hashes are strictly omitted from all controller responses and query selections.
- Generic error messages ("Invalid email or password") prevent user enumeration.

---

## 5. Frontend Feature-Oriented Architecture

```
client/src/
  ├── assets/          ── Static graphics, icons, and fonts
  ├── components/      ── Reusable UI primitives (Button, Card, Badge, Input, Label)
  ├── context/         ── AuthContext with user session state & methods
  ├── features/        ── Domain-sliced feature modules
  │   ├── auth/        ── LoginPage, RegisterPage with Zod & React Hook Form
  │   ├── dashboard/   ── Main metrics, latest readings, quick actions
  │   ├── readings/    ── Reading creation, editing, slot picking, deletion
  │   └── reports/     ── Daily, MTD, and previous-month report views & charts
  ├── hooks/           ── Custom hooks (useAuth)
  ├── layouts/         ── Application layout wrappers, headers, sidebars
  ├── lib/             ── Utility functions (Tailwind merge / cn)
  ├── pages/           ── Top-level route components (PlaceholderPage)
  ├── services/        ── Axios API client with withCredentials: true
  └── types/           ── Shared TypeScript interfaces and contracts
```

### Route Guards:
- **`ProtectedRoute`:** Verifies active session on mount (`GET /api/auth/me`). Shows a branded healthcare loading state while authenticating, redirecting unauthenticated users to `/login`.
- **`PublicOnlyRoute`:** Redirects already authenticated patients away from `/login` and `/register` directly to the dashboard.
