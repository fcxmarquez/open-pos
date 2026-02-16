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
- Admin PIN is hardcoded as `"1234"`

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint and build on push/PR to `main` using Bun.

### Build Config

`next.config.mjs` has `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`.
