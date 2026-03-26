<!-- Copilot instructions for ETMS (Employee Transport Management System) -->
# Copilot instructions — ETMS (Employee Transport Management System)

Purpose: short guidance so an AI coding agent is immediately productive in this repo.

## Big Picture Architecture

### Frontend & Backend Structure
- **etms-frontend** — Original Vite + React + TypeScript app (legacy)
- **etms-frontend2** — Active frontend - Vite + React + TypeScript. Dev: `npm run dev` (port 5173). Entry: `src/main.tsx`, `src/App.tsx`. UI primitives: `src/components/ui/`. Pages: `src/components/`.
- **etms-backend** — Node.js + Express API with PostgreSQL. Dev: `npm run dev` (nodemon, port 5000). Key files: `server.js`, `config/db.js`, `config/passport.js`, `routes/`.

### Role-Based Data Flow
- **Users** → Authenticated via JWT (email/password or Google OAuth)
- **Employees** — linked to users via `user_id`, store employee_id, department, location
- **Drivers** — linked to users, store license, vehicle assignment, earnings
- **Vehicles** — managed by admins, assigned to drivers
- **Trips** — connect employees to drivers/vehicles, track status lifecycle
- **Payments** — link to trips and users, store transaction data
- **Feedback** — employees rate trips/drivers after completion

---

## Database Setup (PostgreSQL)

### Create Database
```bash
CREATE DATABASE etms;
CREATE USER etms WITH PASSWORD 'aaku28';
GRANT ALL PRIVILEGES ON DATABASE etms TO etms;
```

### Run Schema
```bash
cd etms-backend
psql -U etms -d etms -f database/schema.sql
```

**Tables Created:**
- `users` — All users (admin, driver, employee) with JWT-based auth
- `employees` — Employee profiles with department/designation
- `drivers` — Driver profiles with license, vehicle, earnings
- `vehicles` — Fleet management with status tracking
- `routes` — Route definitions and assignments
- `trips` — Individual trip bookings and tracking
- `payments` — Transaction records
- `feedback` — User ratings and complaints
- `admin_logs` — Action audit trail

---

## Development Workflow

### Backend Setup
```bash
cd etms-backend
npm install

# Create .env with:
DB_USER=etms
DB_PASSWORD=aaku28
DB_NAME=etms
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your-secret-key-12345
PORT=5000
FRONTEND_URL=http://localhost:5173

npm run dev  # Starts on port 5000
```

### Frontend Setup
```bash
cd etms-frontend2
npm install

# Create .env.local with:
VITE_API_URL=http://localhost:5000/api

npm run dev  # Starts on port 5173
```

---

## API Architecture

### Authentication Endpoints
- `POST /api/auth/signup` — Register user (returns JWT token)
- `POST /api/auth/login` — Email login (returns JWT + role)
- `GET /api/auth/google` — Google OAuth redirect
- `GET /api/auth/google/callback` — OAuth callback, redirects to `http://localhost:5173/login-success?token=...&role=...`

### Resource Endpoints (all require JWT in Authorization header)
- `/api/employees` — CRUD operations for employees
- `/api/drivers` — CRUD + earnings tracking
- `/api/vehicles` — CRUD + status management
- `/api/trips` — Request, list, update status
- `/api/payments` — Create, list payments
- `/api/feedback` — Submit, list, resolve feedback

---

## Frontend Components & Patterns

### Key Components
- **TranzoLoginPage** — Email/Google login, calls `useAuth().login()`
- **TranzoSignupPage** — Role selection (admin/employee/driver), calls `useAuth().signup()`
- **EmployeeDetailsForm** — Post-signup employee profile completion
- **DriverDetailsForm** — Post-signup driver license/vehicle info
- **AdminDashboard** — Admin role views (users, drivers, vehicles, payments)
- **UserDashboard** — Employee role (trip requests, history, feedback)
- **DriverDashboard** — Driver role (assigned trips, earnings, navigation)

### State Management
- **AuthProvider** (`src/context/AuthContext.tsx`) — Wraps entire app, stores `user`, `token`, `isAuthenticated`
- `localStorage` — Persists `authToken`, `userRole`, `authUser` (JSON)
- No Redux/Zustand; context + React hooks sufficient

### API Service Layer
- **`src/services/api.ts`** — Centralized API calls with auto JWT header injection
- Exported APIs: `authAPI`, `employeeAPI`, `driverAPI`, `vehicleAPI`, `tripAPI`, `paymentAPI`, `feedbackAPI`
- All fetch calls include `Authorization: Bearer <token>` header

### Component Naming
- Page components end with `Page` or `Dashboard` (e.g., `UserDashboard.tsx`)
- UI primitives in `src/components/ui/` (small, reusable, Radix UI-based)
- Shadcn/ui component library used throughout

---

## Important Integration Points

### Frontend ↔ Backend Communication
1. User signs up → `authAPI.signup()` → backend stores in `users` + `employees`/`drivers` table
2. JWT returned, stored in localStorage
3. All subsequent API calls include token in `Authorization` header
4. Backend verifies token in `verifyToken` middleware (TODO: implement full JWT validation)
5. Role-based redirect: token decoded on frontend, localStorage stores `userRole`

### Role-Based Access
- After login, frontend decodes JWT payload (basic: `JSON.parse(atob(token.split('.')[1]))`)
- Role stored in localStorage and AuthContext
- Routing guards check role before showing dashboards

### Database Constraints
- Users must have unique email
- Drivers require license_number
- Trips link employee → driver → vehicle → route
- Foreign keys enforce referential integrity

---

## Specific Patterns in This Codebase

### Password Hashing
- `bcryptjs` used with salt rounds = 10
- Backend: `bcrypt.hash(password, 10)` for signup
- Backend: `bcrypt.compare(password, user.password_hash)` for login

### JWT Token Flow
- Created on signup/login with `jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1d' })`
- Client stores as `authToken` in localStorage
- Frontend decodes JWT payload (no verification on client; trust backend)
- Token sent as `Authorization: Bearer <token>` in all protected requests

### Error Handling
- Backend catches database errors, returns status 500 with error message
- Frontend wrapped in try/catch, displays error in UI
- PostgreSQL unique constraint errors (code 23505) handled explicitly for email duplicates

---

## Configuration & Secrets

### Backend Environment Variables (.env)
```
DB_USER=etms                           # PostgreSQL user
DB_PASSWORD=aaku28                     # PostgreSQL password
DB_NAME=etms                           # Database name
DB_HOST=localhost                      # PostgreSQL host
DB_PORT=5432                           # PostgreSQL port
JWT_SECRET=your-secret-key-here        # ⚠️ CHANGE IN PRODUCTION
JWT_EXPIRY=7d                          # Token expiration
PORT=5000                              # Server port
NODE_ENV=development|production
FRONTEND_URL=http://localhost:5173     # CORS origin
GOOGLE_CLIENT_ID=...                   # OAuth credentials
GOOGLE_CLIENT_SECRET=...
```

### Frontend Environment Variables (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Common Tasks

### Add New API Endpoint
1. Create controller function in `etms-backend/controllers/` (or in routes file)
2. Add route to `etms-backend/routes/resources.routes.js`
3. Include `verifyToken` middleware for protected endpoints
4. Add corresponding API function to `etms-frontend2/src/services/api.ts`
5. Import and use in component via `useAuth()` or direct API call

### Add New Database Table
1. Create table definition in `etms-backend/database/schema.sql`
2. Add foreign key constraints if linking to existing tables
3. Create indexes for performance
4. Run `psql -U etms -d etms -f database/schema.sql` to apply

### Update Frontend Component
- Import services: `import { tripAPI } from '../services/api'`
- Use auth context: `const { user, token } = useAuth()`
- Fetch data in useEffect with token validation
- Display UI primitives from `src/components/ui/`

---

## Key Files Reference

### Backend
- `server.js` — Express app setup, route registration
- `config/db.js` — PostgreSQL pool initialization
- `config/passport.js` — Google OAuth strategy
- `routes/auth.routes.js` — Email signup/login, OAuth callbacks
- `routes/resources.routes.js` — CRUD endpoints for all resources
- `controllers/authController.js` — Reusable auth logic (partial use)
- `database/schema.sql` — Complete database schema

### Frontend
- `src/main.tsx` — Wraps app with `AuthProvider`
- `src/App.tsx` — Route definitions
- `src/context/AuthContext.tsx` — Authentication state & methods
- `src/services/api.ts` — Centralized API calls
- `src/components/TranzoLoginPage.tsx` — Login form, calls `useAuth()`
- `src/components/TranzoSignupPage.tsx` — Signup form with role selection
- `src/components/*Dashboard.tsx` — Role-based dashboards
- `src/components/ui/*` — Shadcn/ui primitives

---

## Deployment Notes (Future)

### Secrets Management
- **Do NOT commit `.env`** — Use environment variables or secrets manager
- Database credentials should be managed by hosting provider (RDS, managed DB)
- JWT_SECRET must be cryptographically random for production
- Google OAuth credentials scoped to production domain

### Database Backups
- PostgreSQL should be backed up daily (using pg_dump or managed provider)
- Keep backups for at least 30 days

### Frontend Build
```bash
cd etms-frontend2
npm run build  # Creates dist/ folder
# Deploy dist/ to static host (Vercel, AWS S3, etc.)
```

---

## Troubleshooting

### CORS Errors
- Ensure backend CORS is enabled: `app.use(cors())`
- Verify `VITE_API_URL` in frontend `.env.local` matches backend URL
- Check browser console for exact error

### JWT Errors
- Verify `JWT_SECRET` is set in backend `.env`
- Check token expiry (7 days default)
- Clear localStorage and re-login if token invalid

### Database Connection
- Ensure PostgreSQL service is running: `psql -U postgres` (test connection)
- Check `.env` credentials match database setup
- Verify database `etms` exists: `\l` in psql

### TypeScript Errors
- Run `npm run build` to catch compilation issues
- Check import paths are relative or module-aliased correctly
- Ensure all installed packages have @types definitions

If any section is incomplete or unclear, ask for expansion!

