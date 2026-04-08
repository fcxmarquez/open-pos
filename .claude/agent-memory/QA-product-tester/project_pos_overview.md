---
name: POS App Overview
description: Key routes, auth, and environment details for Papelería Luna POS
type: project
---

The app runs at http://localhost:3000. Start dev server with `bun run dev` from the project root.

Routes tested:
- `/productos` — Product management screen (no PIN required in test env with AUTH_BYPASS=true)
- `/ventas` — Sales screen
- `/corte` — Cash reconciliation

Auth: With AUTH_BYPASS=true in .env.local, the app skips Google OAuth. The dashboard at /admin/dashboard loads directly when authenticated. The POS screens are at /productos, /ventas, /corte.

PIN protection (1234) for Productos/Corte does NOT appear when AUTH_BYPASS is active in the tested environment.

**Why:** AUTH_BYPASS=true combined with root/testing credentials bypasses the usual PIN gate in dev.

**How to apply:** Navigate directly to /productos, /ventas, /corte — no PIN prompt expected.
