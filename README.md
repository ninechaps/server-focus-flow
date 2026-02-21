# Focus Flow — Server

A full-stack Next.js dashboard with custom JWT authentication and a complete RBAC (Role-Based Access Control) system.

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router)
- **Language** — [TypeScript](https://www.typescriptlang.org) (strict)
- **Auth** — Custom JWT (access token + refresh token + RSA public key)
- **Database ORM** — [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Components** — [shadcn/ui](https://ui.shadcn.com) (New York style)
- **Tables** — [TanStack Table](https://tanstack.com/table)
- **Forms** — [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- **State (URL)** — [Nuqs](https://nuqs.47ng.com)
- **State (global)** — [Zustand](https://zustand-demo.pmnd.rs)
- **Toasts** — [Sonner](https://sonner.emilkowal.ski)
- **Linting / Formatting** — ESLint + Prettier + Husky

## Features

- **Custom JWT Auth** — Email/password login, email verification code, access + refresh token rotation
- **RBAC** — Roles, permissions, user-role assignments; all enforced server-side via `withAdminPermission`
- **Admin Dashboard**
  - User management (list, search, assign roles)
  - Role management (create/edit/delete, view users per role)
  - Permission management (create/edit/delete, view roles per permission)
  - Session management (online status, heartbeat, per-user session history)
- **Session Heartbeat** — Client sends heartbeat every 2 min to keep online status accurate
- **Multi-theme** — 6 built-in themes with OKLCH color system, persisted via cookie
- **Cmd+K** — Global command palette via kbar

## Project Structure

```
src/
├── app/
│   ├── api/               # API routes (auth, admin, sessions, sync)
│   ├── auth/              # Login & register pages
│   └── dashboard/         # Protected dashboard pages
│       └── admin/         # users / roles / permissions / sessions
├── components/
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Sidebar, header, heartbeat provider
├── features/
│   ├── admin/             # User, role, permission tables & dialogs
│   ├── auth/              # Login & register forms
│   ├── sessions/          # Session listing & detail sheet
│   └── profile/           # Profile page
├── hooks/                 # use-heartbeat, use-nav, use-data-table …
├── server/
│   ├── auth/              # JWT, middleware, session, RSA, validation
│   ├── db/                # Drizzle schema & client
│   └── repositories/      # user, role, permission repositories
└── config/
    └── nav-config.ts      # RBAC-aware navigation config
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL database

### Setup

```bash
# Install dependencies
bun install

# Copy environment file
cp env.example.txt .env.local
# Fill in DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, etc.

# Run dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
bun run dev          # Dev server
bun run build        # Production build
bun run start        # Start production server
bun run lint         # ESLint
bun run lint:fix     # ESLint fix + Prettier format
bun run format       # Prettier format
```

## Environment Variables

See `env.example.txt` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (24h) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (30d) |

## RBAC

Navigation items support access control via the `access` field in `src/config/nav-config.ts`:

```ts
{
  title: 'Access Control',
  access: { permission: 'admin:users:read' },
  items: [
    { title: 'Roles', url: '/dashboard/admin/roles' },
    { title: 'Permissions', url: '/dashboard/admin/permissions' },
  ]
}
```

API routes use `withAdminPermission` for real-time DB permission checks (avoids stale JWT snapshots).
