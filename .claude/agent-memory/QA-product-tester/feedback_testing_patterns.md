---
name: Playwright Testing Patterns for POS
description: Practical patterns for navigating and testing this app with Playwright MCP
type: feedback
---

## Snapshot depth
Use depth 10 + filename to save snapshots for grep analysis. `depth=4` often collapses refs under generic containers, making it hard to find specific button refs.

**How to apply:** `browser_snapshot depth=10 filename=".playwright-mcp/snapshot_name.md"` then grep the saved file.

## Finding button refs
After saving a snapshot file, use:
```
grep -n "Agregar\|button\|Limpiar" .playwright-mcp/snapshot_name.md
```
The empty-state "Agregar producto" button is always `.nth(1)` (header button is `.first()`).

## Large product database workaround
The DB has 3256 products. Short numeric strings (1–3 digits) almost always match product barcodes/names.
To force an empty result state with a short numeric query, add `&category=General` — the "General" category has no products matching common numbers.

**Why:** Tests for "1–3 digit → no prefill" need an empty state, but `12`, `888`, etc. all return matches without category filter.

## URL-based navigation
Prefer navigating via URL params (`/productos?q=VALUE`) over typing in the search box, to ensure the state is clean and `normalizedSearch` reflects exactly what's being tested.

## Ref stability
Refs change after page navigation/reload. Always re-snapshot after navigating to a new URL to get fresh refs. The "Borrar búsqueda" (clear search) button ref especially changes.
