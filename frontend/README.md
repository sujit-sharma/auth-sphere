# Auth Sphere — Frontend

React + TypeScript (Vite) client for the Auth Sphere backend.

```bash
pnpm install
pnpm dev        # http://localhost:5173, proxies /api -> http://localhost:4000
pnpm build
```

Start the backend first (`../backend`, `pnpm dev`). Seeded admin: `admin@auth-sphere.local` / `ChangeMe123!`.

## Auth flow

- Access token is kept in memory only; the refresh token stays in the backend's httpOnly cookie.
- On page load the app calls `POST /auth/refresh-token` to restore the session.
- A 401 triggers one shared refresh (single-flight, since refresh tokens rotate) and retries the request; if refresh fails the user is signed out.
- UI is gated by the `permissions`/`roles` from `/auth/me` (`RequirePermission`, `hasPermission`). The backend still enforces everything.

## Pages

Login, Register, Dashboard (profile/roles/permissions), Security (change password, sign out everywhere), and admin Users / Roles / Permissions.
