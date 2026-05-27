# QuickHire — Claude Context

## Project overview
QuickHire is a two-sided job marketplace connecting **clients** (post jobs) and **workers** (apply for jobs). Users can switch between both roles. The app is a TypeScript monorepo with a separate Express backend and React frontend.

## Architecture

```
quickhire/
├── server/   Express + MongoDB API (port 8000)
└── client/   React + Vite SPA (port 3001)
```

### Server (`server/`)
- **Framework**: Express.js with http + Socket.IO for real-time notifications
- **Database**: MongoDB via Mongoose with GeoJSON `2dsphere` indexes on user and job locations
- **Auth**: JWT — 15-minute access token in memory + 7-day refresh token in httpOnly cookie
- **File uploads**: Cloudinary (`server/src/config/cloudinary.ts`)
- **Email**: Resend (`server/src/lib/email.ts`)
- **Geocoding**: Mapbox server-side proxy (`server/src/controllers/geocodeController.ts`)
- **Dev**: `npm run dev` → `tsx watch src/index.ts`

### Client (`client/`)
- **Framework**: React 19, TypeScript, Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + shadcn/ui (`components.json`)
- **Maps**: Mapbox GL / react-map-gl
- **HTTP**: Axios instance at `client/src/lib/api.ts` — auto-refreshes access token on 401
- **Realtime**: Socket.IO client, auth via access token in handshake
- **Path alias**: `@` → `client/src/`
- **Dev**: `npm run dev` → Vite on port 3001, proxies `/api` and `/socket.io` to `http://localhost:8000`

## Key domain types (`server/src/types/index.ts`)

| Constant | Values |
|---|---|
| `SKILL_CATEGORIES` | ELECTRICAL, PLUMBING, CARPENTRY, PAINTING, HVAC, LANDSCAPING, CLEANING, GENERAL_HANDYMAN, ROOFING, TILING, APPLIANCE_REPAIR, PEST_CONTROL |
| `JOB_STATUSES` | OPEN, IN_REVIEW, ASSIGNED, COMPLETED, CANCELLED, EXPIRED |
| `APPLICATION_STATUSES` | PENDING, SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN |
| `URGENCY_LEVELS` | FLEXIBLE, SOON, URGENT, EMERGENCY |
| `ROLES` | CLIENT, WORKER |

## API routes
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/users/me
GET/PUT /api/users/:id

GET/POST       /api/jobs
GET/PUT/DELETE /api/jobs/:id

GET/POST       /api/applications
GET/PUT        /api/applications/:id

GET/POST       /api/notifications
GET/DELETE     /api/notifications/:id

GET/POST       /api/reviews
GET            /api/reviews/:id

POST           /api/upload
GET            /api/geocode
GET            /api/health
```

## Socket.IO
- Users join a private room `user:<userId>` on connect
- Access token passed via `socket.handshake.auth.token`
- Push notifications from `server/src/lib/notifications.ts` via `getIO().to('user:<id>').emit(...)`

## Auth flow
1. Login → server returns `{ accessToken }` + sets `refreshToken` httpOnly cookie
2. Client stores `accessToken` in React state and module-level var (`setToken`)
3. On 401, Axios interceptor calls `POST /api/auth/refresh` (cookie sent automatically) → retries original request
4. Active role (`CLIENT`/`WORKER`) stored in `localStorage` key `activeRole`
5. After login, `AuthContext` detects activity via two parallel calls (`GET /api/jobs?clientId=<id>&limit=1` and `GET /api/applications?limit=1`) and auto-sets role: worker-only → `WORKER`, otherwise → `CLIENT`. `login()` returns the determined role so `Login.tsx` can navigate immediately without a stale closure.
6. Same activity detection runs on session restore (page refresh) to populate `hasClientActivity` / `hasWorkerActivity` flags in context.

## Role system
- **RoleSwitcher** (`components/layout/RoleSwitcher.tsx`): single button — "Switch to Client" or "Switch to Worker" — always visible so users can freely move between roles regardless of activity history.
- **Route guards** (`App.tsx` — `ClientGuard` / `WorkerGuard`): layout-route wrappers inside `DashboardLayout`. If `activeRole` doesn't match the route tree, they redirect to the correct dashboard (`/client` or `/worker`). Shared routes (`/profile`, `/notifications`) are unguarded.
- **`hasClientActivity` / `hasWorkerActivity`**: boolean flags in `AuthContext`, true if the user has posted at least one job / submitted at least one application. Available via `useAuth()`.

## Data model highlights
- **User**: has `location` (GeoJSON Point), `skills[]` (category + yearsExp), `searchRadius` (meters), separate `clientRating` / `workerRating`
- **Job**: has `location` (GeoJSON Point), `budgetMin/Max`, `photos[]`, `isFeatured`, `expiresAt`; `toJSON` transform adds flat `latitude`/`longitude` fields for frontend
- **Application**: references both job and worker, tracks status lifecycle
- **Notification**: typed via `NOTIFICATION_TYPES`, references `actorId` and optional `jobId`/`applicationId`

## Dev setup
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

### Required env vars
**`server/.env`** (see `server/.env.example`):
- `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`, `MAPBOX_TOKEN`
- `PORT=8000`, `CLIENT_URL=http://localhost:3001`

**`client/.env`** (see `client/.env.example`):
- `VITE_API_URL=http://localhost:8000`
- `VITE_MAPBOX_TOKEN`

## Client source layout
```
client/src/
├── components/
│   ├── applications/   ApplicationForm
│   ├── jobs/           JobCard, JobForm, JobLocationPicker, NearbyJobsMap, ApplicantCard, DeleteJobButton
│   ├── layout/         Sidebar, NotificationBell, RoleSwitcher, ThemeToggle
│   ├── notifications/  NotificationItem, ClearAllNotificationsButton
│   ├── profile/        AvatarUpload, SkillPicker
│   ├── reviews/        ReviewForm, ReviewList
│   └── ui/             shadcn primitives
├── context/            AuthContext
├── hooks/              useGeolocation, useRealtimeNotifications
├── lib/                api.ts (axios), utils.ts
├── pages/
│   ├── auth/           Login, Register
│   ├── dashboard/
│   │   ├── client/     ClientDashboard, ClientJobs, ClientJobDetail, PostJob, EditJob
│   │   └── worker/     WorkerDashboard, BrowseJobs, WorkerJobDetail, MyApplications
│   ├── profile/        EditProfile, UserProfile
│   └── Landing.tsx
└── types/index.ts
```
