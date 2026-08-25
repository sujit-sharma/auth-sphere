# Auth Sphere — Backend

Centralized authentication & authorization service built with Node.js, TypeScript, Express, Prisma, and MySQL.

## Features

- Email/password registration & login
- JWT access tokens (short-lived) + rotating refresh tokens (httpOnly cookie, stored hashed in DB, reuse detection)
- Role-based access control (RBAC): users ↔ roles ↔ permissions
- Admin APIs for managing users, roles, and permissions
- Centralized error handling, request validation (Zod), structured logging (Pino), rate limiting on auth endpoints

## Stack

- Node.js + TypeScript
- Express
- MySQL + Prisma ORM
- JWT (`jsonwebtoken`) + `bcryptjs`
- Zod for request validation

## Getting started

### 1. Prerequisites

- Node.js >= 20
- pnpm
- A running MySQL instance

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

A `.env` was generated for local dev with random JWT secrets. Review and adjust `DATABASE_URL` to point at your MySQL instance:

```bash
cp .env.example .env   # if you need to regenerate it
```

### 4. Run migrations & seed data

```bash
pnpm prisma:migrate --name init
pnpm prisma:seed
```

The seed creates `admin`/`user` roles, baseline permissions, and an admin user (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`, defaults to `admin@auth-sphere.local` / `ChangeMe123!`).

### 5. Run the dev server

```bash
pnpm dev
```

Server starts on `http://localhost:4000` (see `PORT` in `.env`). Health check: `GET /api/v1/health`.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled server from `dist/` |
| `pnpm lint` / `pnpm lint:fix` | Lint the codebase |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm test` | Run tests with Vitest |
| `pnpm prisma:migrate` | Create/apply a dev migration |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:seed` | Seed roles/permissions/admin user |

## API overview

All routes are prefixed with `/api/v1`.

### Auth (`/auth`)

- `POST /register` — create a new user (default `user` role)
- `POST /login` — returns `accessToken` in the body and sets a `refresh_token` httpOnly cookie
- `POST /refresh-token` — rotates the refresh token, returns a new `accessToken`
- `POST /logout` — revokes the current refresh token
- `POST /logout-all` — revokes all refresh tokens for the authenticated user
- `GET /me` — current authenticated user profile, roles & permissions
- `POST /change-password` — change password (requires current password, revokes all sessions)

### Users (`/users`) — requires `users:*` permissions

- `GET /` — paginated list (`?page=&pageSize=&search=`)
- `GET /:userId`
- `PATCH /:userId`
- `DELETE /:userId`
- `PUT /:userId/roles` — replace a user's role assignments

### Roles (`/roles`) — requires `roles:*` permissions

- `GET /`, `GET /:roleId`, `POST /`, `PATCH /:roleId`, `DELETE /:roleId`
- `PUT /:roleId/permissions` — replace a role's permission assignments

### Permissions (`/permissions`) — requires `roles:*` permissions

- `GET /`, `POST /`, `DELETE /:permissionId`

## Project structure

```
src/
  config/        env, logger, prisma client
  middlewares/   auth, rbac, validation, error handling
  modules/
    auth/        register/login/refresh/logout, JWT issuance
    user/        user CRUD + role assignment
    role/        role CRUD + permission assignment
    permission/  permission CRUD
  routes/        route aggregation
  utils/         ApiError, asyncHandler, password/jwt/refresh-token helpers
  app.ts         Express app wiring
  server.ts      process entrypoint
prisma/
  schema.prisma  data model
  seed.ts        default roles/permissions/admin user
```

## Notes on the auth model

- Access tokens are stateless JWTs carrying `sub`, `email`, `roles`, `permissions` and are verified on every request via the `authenticate` middleware.
- Refresh tokens are opaque random values; only their SHA-256 hash is stored in `refresh_tokens`. Each refresh rotates the token and marks the old one as revoked (reuse of a revoked token revokes the entire session chain for that user, guarding against token theft).
- Authorization is enforced with `requireRoles(...)` / `requirePermissions(...)` middleware, backed by the `roles` ↔ `permissions` many-to-many tables — extend by seeding new permissions and attaching them to roles.