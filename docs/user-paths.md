# User Paths

Last updated: 2026-02-21

This document lists the end-to-end user paths currently implemented in the POS app.

## Route Entry Paths

| Path | User path |
|---|---|
| `/` | Redirects to `/ventas`. |
| `/login` | Shows Google sign-in screen when no active session exists. |
| `/ventas` | Opens sales flow (no admin PIN required). |
| `/productos` | Opens product management flow (PIN-protected in UI). |
| `/corte` | Opens cash reconciliation flow (PIN-protected in UI). |

## Authentication Paths

| ID | User path | Outcome |
|---|---|---|
| AUTH-01 | User opens `/login` with active session | Redirect to `/ventas`. |
| AUTH-02 | User opens `/login` without session | Login card with Google button is shown. |
| AUTH-03 | User signs in with Google and allowed email | Session is created and app redirects to `/ventas`. |
| AUTH-04 | User signs in with disallowed email | Access is denied and login error message is shown. |
| AUTH-05 | Login error query param is present | Contextual error message is shown on login page. |

## Shell Navigation and Admin Access Paths

| ID | User path | Outcome |
|---|---|---|
| NAV-01 | User navigates to `Ventas` | Screen opens directly. |
| NAV-02 | User navigates to `Productos` while locked | PIN dialog opens. |
| NAV-03 | User navigates to `Corte` while locked | PIN dialog opens. |
| NAV-04 | User enters correct PIN | Admin unlock state is enabled and pending protected screen opens. |
| NAV-05 | User enters incorrect PIN | Error state is shown and PIN inputs reset. |
| NAV-06 | User cancels PIN dialog | Protected navigation is aborted. |
| NAV-07 | Admin uses logout button | Admin unlock state resets and route goes to `/ventas`. |

## Ventas Paths

| ID | User path | Outcome |
|---|---|---|
| VEN-01 | User scans/submits barcode for known product | Product is added to cart. |
| VEN-02 | User searches by name with one match | Product is added to cart. |
| VEN-03 | User searches by name with multiple matches | Dropdown list is shown; selecting one adds product. |
| VEN-04 | User searches with no match | Unregistered product sheet opens with scanned code. |
| VEN-05 | User taps frequent product | Product is added to cart. |
| VEN-06 | User opens quick sale (button or `F4`) | Quick sale dialog opens. |
| VEN-07 | User submits quick sale | Temporary cart item is added. |
| VEN-08 | User increments/decrements quantity | Cart quantity updates in place. |
| VEN-09 | User edits quantity input directly | Cart quantity updates in place. |
| VEN-10 | User removes cart item | Item is removed from cart. |
| VEN-11 | User cancels sale and confirms dialog | Cart is cleared. |
| VEN-12 | User opens checkout (`Cobrar`, `F2`, or `Ctrl+Enter`) | Checkout dialog opens when cart has items. |
| VEN-13 | User enters payment lower than total | "Falta" state is shown and confirm is blocked. |
| VEN-14 | User enters payment equal or higher than total | "Cambio" state is shown and confirm is enabled. |
| VEN-15 | User confirms checkout successfully | Sale is persisted and cart is cleared. |
| VEN-16 | User opens mobile cart drawer | Mobile cart overlay and drawer are shown. |
| VEN-17 | User closes mobile cart drawer | Mobile cart overlay and drawer are hidden. |

## Unregistered Product Sheet Paths

| ID | User path | Outcome |
|---|---|---|
| UNR-01 | User chooses "Registrar y agregar" | Product is saved to catalog and added to cart. |
| UNR-02 | User chooses "Solo agregar a venta" | Temporary product is added to cart without catalog save. |
| UNR-03 | Product registration fails | Error toast is shown; user remains in sheet. |

## Productos Paths

| ID | User path | Outcome |
|---|---|---|
| PRO-01 | Screen loads | Product list query runs; loading spinner appears while pending. |
| PRO-02 | User types in search | Debounced server-side search filters products. |
| PRO-03 | User changes category filter | Product list is filtered by category. |
| PRO-04 | User combines search + category filter | Product list respects both filters. |
| PRO-05 | User opens add-product dialog | Empty product form is shown. |
| PRO-06 | User submits valid new product | Product is created and list is refreshed. |
| PRO-07 | User opens edit on existing product | Form opens pre-filled with selected product values. |
| PRO-08 | User saves valid edits | Product is updated and list is refreshed. |
| PRO-09 | User submits invalid product form | Validation errors are shown (required fields). |
| PRO-10 | User submits duplicate barcode | Error toast is shown from server action. |
| PRO-11 | User deletes product and confirms | Product is deleted and list is refreshed. |
| PRO-12 | Product has pending/placeholder name | "Sin nombre" warning state is surfaced in badge/row styling. |
| PRO-13 | Filter result is empty | Empty-state message is shown. |

## Corte Paths

| ID | User path | Outcome |
|---|---|---|
| COR-01 | Screen loads | Today's session and sales data are queried. |
| COR-02 | User views summary cards | Sales count, total, and items sold are shown. |
| COR-03 | User types counted cash equal to system | "Cuadra perfecto" state is shown. |
| COR-04 | User types counted cash above system | "Sobrante" state is shown. |
| COR-05 | User types counted cash below system | "Faltante" state is shown. |
| COR-06 | User submits close-cash and confirms | Session closes and related queries are refreshed. |
| COR-07 | Session is already closed | Locked/read-only "Corte ya registrado" state is shown. |
| COR-08 | User expands sales detail accordion | Today's sales detail list/table is shown. |
| COR-09 | User has historical closed sessions | History table/cards are shown (excluding today). |

## Non-User-Facing Routes

These routes exist but are not end-user interaction paths in the POS UI flow:

- `/api/health`
- `/api/auth/[...nextauth]`
