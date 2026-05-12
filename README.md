# NestJS Auth API

Authentication and task management backend built with NestJS, Drizzle ORM, JWT, role-based authorization, throttling, and Swagger docs.

## Features

- Auth flows: register, email verification, login, refresh token, logout, forgot/reset password
- JWT auth guard applied globally
- Role-based access guard (`admin` endpoints)
- Task CRUD for authenticated users
- Admin user management endpoints
- Validation with `class-validator` + `ValidationPipe`
- API documentation with Swagger UI

## Tech Stack

- NestJS 11
- TypeScript
- Drizzle ORM
- PostgreSQL (via `DATABASE_URL`)
- Resend (transactional email)
- Swagger (`@nestjs/swagger`)

## Environment Variables

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required (or strongly recommended) keys:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (example: `15m`)
- `JWT_REFRESH_EXPIRES_IN` (example: `7d`)
- `RESEND_API_KEY`
- `APP_URL` (example: `http://localhost:3000`)
- `PORT`

Optional:

- `RESEND_FROM_EMAIL` (defaults to `onboarding@resend.dev`)

## Installation

```bash
pnpm install
```

## Database

```bash
pnpm run db:generate
pnpm run db:push
```

## Run

```bash
# dev
pnpm run start:dev

# build
pnpm run build

# production
pnpm run start:prod
```

## Deploy on Vercel

Vercel runs this API as a serverless function. If you see `500` / `FUNCTION_INVOCATION_FAILED`, open **Project → Logs** on Vercel: the stack trace is usually a missing env var or a startup error.

1. Connect the repo and deploy with the default NestJS settings (Vercel detects `src/main.ts`; use a recent [Vercel CLI](https://vercel.com/docs/cli) if you deploy from the terminal).
2. In **Project → Settings → Environment Variables**, add every key from `.env.example` for **Production** (and Preview if you use preview deployments). `DATABASE_URL` is required: without it the app throws during boot when the DB module loads.
3. Set `APP_URL` to your deployed origin (for example `https://<project>.vercel.app`) so auth email links point at production.
4. After changing env vars, trigger a new deployment (redeploy) so functions pick them up.

## Swagger

- UI: `http://localhost:3000/api/docs`
- JSON: `http://localhost:3000/api/docs-json`

If Swagger seems stale, restart the dev server and hard refresh the browser.

## API Modules

- `AuthModule` (`/api/auth`)
- `TasksModule` (`/api/tasks`)
- `AdminModule` (`/api/admin`)
- `UsersModule` (internal provider/export module)

## Main Endpoints

### Auth

- `POST /api/auth/register`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Tasks (Auth required)

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Admin (Admin role required)

- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

## Scripts

```bash
pnpm run start
pnpm run start:dev
pnpm run start:debug
pnpm run build
pnpm run start:prod
pnpm run lint
pnpm run test
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e
pnpm run db:generate
pnpm run db:push
pnpm run db:migrate
pnpm run db:studio
```
