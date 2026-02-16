# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Dev server at http://localhost:3000
bun run build            # Production build
bun run start            # Start production server
bun run lint             # ESLint
bun run lint:fix         # ESLint fix + format
bun run lint:strict      # Zero warnings tolerance
bun run format           # Prettier format
bun run format:check     # Check formatting
```

No test framework is configured. Adding shadcn components: `npx shadcn add <component-name>`.

**Pre-commit hooks**: Husky + lint-staged runs Prettier on all staged JS/TS/CSS files automatically. Run `bun run prepare` to install hooks after cloning.

## Architecture

**Next.js 16 App Router** dashboard starter with React 19, TypeScript 5.7 (strict), Tailwind CSS v4, shadcn/ui (New York style), Clerk auth, and Sentry error tracking.

### Route Groups

- `(auth)` — Sign-in/sign-up pages using Clerk catch-all routes
- `(dashboard)` — Protected dashboard pages with sidebar layout

The dashboard overview uses **parallel routes** (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`) for independent loading/error states per analytics section.

### Feature-Based Organization

Business logic lives in `src/features/{feature}/` (auth, kanban, overview, products, profile). Each feature contains its own components, utils, and stores. Route pages in `src/app/` import from features.

### Key Architectural Patterns

- **Server components by default** — only use `'use client'` when browser APIs or hooks are needed
- **State management**: Zustand (global state with persist middleware), Nuqs (URL search params), React Hook Form + Zod (forms)
- **Data tables**: TanStack Table with server-side filtering via nuqs. Column definitions in `features/*/components/*-tables/columns.tsx`, filter parsers in `src/lib/parsers.ts`
- **Mock API**: `src/constants/mock-api.ts` uses Faker.js — no real database or API routes
- **RBAC navigation**: `src/config/nav-config.ts` defines nav items with `access` property (requireOrg, permission, role, plan, feature). Filtered client-side by `useFilteredNavItems()` hook in `src/hooks/use-nav.ts`
- **Theme system**: 6 themes in `src/styles/themes/`, configured in `src/components/themes/theme.config.ts`, persisted via cookie (`active_theme`). Uses OKLCH color format with CSS custom properties

### Auth (Clerk)

- Server-side: `const { orgId } = await auth()` from `@clerk/nextjs`
- Client-side protection: `<Protect plan="pro">` component
- No middleware file — route protection is handled at the page level
- Supports keyless mode (works without API keys for dev)
- Environment config: copy `env.example.txt` to `.env.local`

### Providers (root layout)

NuqsAdapter > ThemeProvider > ClerkProvider, with NextTopLoader and Sonner for toasts.

### Dashboard layout

KBar (Cmd+K) > SidebarProvider > InfobarProvider, with AppSidebar + Header + InfoSidebar wrapping content.

## Code Conventions

- **Class merging**: Always use `cn()` from `@/lib/utils` — never concatenate class strings
- **Imports**: Use `@/*` alias for `src/`, `~/*` for `public/`
- **Prettier**: single quotes, JSX single quotes, no trailing commas, 2-space indent, `prettier-plugin-tailwindcss`
- **Components**: function declarations, props interface named `{ComponentName}Props`
- **shadcn/ui**: Don't modify `src/components/ui/` directly; extend or wrap instead
- **Icons**: Registered in `src/components/icons.tsx` using @tabler/icons-react and lucide-react

## Cleanup System

`__CLEANUP__/` contains scripts to remove optional features (clerk, kanban, sentry):
```bash
node __CLEANUP__/scripts/cleanup.js --list
node __CLEANUP__/scripts/cleanup.js <feature>
```

## Reference

See `AGENTS.md` for detailed patterns, code examples, and troubleshooting. See `docs/` for Clerk setup, RBAC, and theme customization guides.
