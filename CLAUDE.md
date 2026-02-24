# CLAUDE.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

POS (Point of Sale) system for a stationery store ("Papelería Luna"). Built with Next.js App Router, TypeScript, and Zustand for state management.

## Commands

- **Dev server**: `bun run dev`
- **Build**: `bun run build`
- **Lint**: `bun run lint`
- **Install deps**: `bun install --frozen-lockfile`

No test framework is configured.

## Architecture

### App Structure

Single-page application using Next.js App Router (`app/` directory). The root page renders `AppShell` which manages navigation between three screens:

- **VentasScreen** — Sales/checkout with cart, barcode lookup, and payment processing
- **ProductosScreen** — Product CRUD management (PIN-protected)
- **CorteScreen** — Cash reconciliation/daily audit (PIN-protected)

### State Management

All application state lives in a single Zustand store (`lib/store.ts`) with localStorage persistence (key: `papeleria-pos-storage`). The store manages products, cart, sales history, and reconciliation records.

### UI Layer

Components in `components/ui/` are shadcn/ui primitives (Radix UI + Tailwind CSS). Business logic components live in `components/pos/`. Styling uses Tailwind CSS with HSL CSS custom variables for theming and class-based dark mode.

### Key Conventions

- All interactive components use `"use client"` directive
- Forms use React Hook Form with Zod validation schemas
- Currency formatted as `$X.XX` via inline `toFixed(2)`
- Dates use `date-fns` with `es-MX` (Spanish/Mexico) locale
- Path alias: `@/*` maps to project root
- Admin PIN is configured via `NEXT_PUBLIC_ADMIN_PIN` env variable (defaults to `"1234"`)

### Directory & File Naming Conventions

- Each component lives in its own directory named with kebab-case: `component-name/index.tsx`.
  - Example: `components/pos/sales-screen/index.tsx`
- If a component has a TanStack Query used only by that component, place it inside the component directory as `query.ts`.
  - Example: `components/pos/sales-screen/query.ts`
- Shared/global TanStack Query definitions (used by multiple components) live in `lib/query/`.

### Query Organization Conventions

- Server-side database query modules live in `lib/server/queries/*` (not under `app/*`).
- `app/actions/*` files are the server action boundary and can call `lib/server/queries/*`.
- Global TanStack Query client/cache definitions live in `lib/query/`. Component-local queries live alongside the component as `query.ts` (e.g. `components/pos/sales-screen/query.ts`).
- Keep UI components focused on rendering and interactions: extract query keys and query functions into the query files.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint and build on push/PR to `main` using Bun.

### Build Config

`next.config.mjs` has `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`.

## Code Workflow

### Git Workflow

- Follows @commitlint/config-conventional standards
- The commit doesn't have to have a body. Has to be brief. Don't mention you as co-author in the commit message.

### Testing and Quality Checks

- After each finished task, run:
  - `bun run lint`
  - `bunx tsc --noEmit`
  - `bun run build`

### Automated Testing / Remote Agents

The app supports an alternative login mode for automated testing and CI environments. When this mode is active, the login page shows a username/password form instead of Google OAuth. Use the following credentials to log in:

- **Username**: `root`
- **Password**: `testing`

This mode is enabled via an environment variable in `.env.local`. Check `.env.example` for the variable name and usage instructions.