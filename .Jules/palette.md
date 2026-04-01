## 2023-10-27 - Empty State Polish

**Learning:** Added an empty state with an icon and helpful call-to-action when search returns no products.

**Action:** Remember to use existing icons (like `Search`) and helpful text to guide the user when no results are found in list views.

## 2024-05-18 - Missing Accessibility Labels

**Learning:** Icon-only buttons without ARIA labels are invisible to screen readers, making critical actions like 'remove item' inaccessible.

**Action:** Always add aria-label to icon buttons, describing the action + the item it acts on.

## 2024-05-20 - Unhelpful Empty States
**Learning:** Empty states with just text feel like errors or dead ends. Adding a relevant icon and actionable guidance makes them feel like part of the application flow and helps users recover.
**Action:** Always include an icon, a clear heading, and actionable guidance in empty states.

## 2026-03-08 - Input Placeholder Clarity
**Learning:** Inputs without placeholders can be confusing, particularly when they are empty by default. Adding placeholders improves clarity by showing the user the format or a generic example of what is expected.
**Action:** Add helpful placeholders to empty inputs by default to guide user input.

## 2026-03-09 - Multi-input field context
**Learning:** Multi-input fields like PINs or OTPs split a single logical input into multiple physical inputs, causing screen readers to lose the overall context and announce generic input fields consecutively without distinction.
**Action:** Always add explicit `aria-label` attributes to each split input to indicate its position and purpose (e.g., "Dígito 1 del PIN").

## 2026-03-09 - Numeric Mobile Keyboards
**Learning:** `type="number"` doesn't always automatically show the numeric keypad on mobile devices, or sometimes shows a numeric keypad without decimal capabilities, leading to friction. Adding `inputMode="decimal"` significantly improves the mobile UX by forcing the correct numeric keyboard to appear right away.
**Action:** Whenever a numeric input is designed (especially for currency or float values), always include `inputMode="decimal"` alongside `type="number"`.

## 2026-03-09 - Label in Name WCAG compliance
**Learning:** When adding `aria-label` to buttons that already have visible text to add extra context, the exact visible text string MUST be a continuous substring of the `aria-label` value. For example, if the button says "Editar seleccionados", the label should be "Editar seleccionados (1 producto)", not "Editar 1 productos seleccionados", which violates WCAG 2.5.3 (Label in Name). This is critical for speech recognition users.
**Action:** Always ensure the visible text of an interactive element is fully contained within its accessible name (`aria-label` or `aria-labelledby`).

## 2026-03-20 - Add Call-to-Action Buttons to Empty States
**Learning:** Empty states without immediate calls-to-action leave users stranded, especially after filtering. By providing actionable context-aware buttons (like "Limpiar filtros" when filters are active, and "Agregar producto" regardless) directly inside the empty state message, the UI becomes significantly more intuitive and reduces unnecessary navigation clicks.
**Action:** Whenever designing or updating an empty state for a searchable/filterable list, always include contextual buttons to reset filters or create a new item immediately within the empty state container.

## 2026-03-24 - Inline Editable Inputs Context
**Learning:** Inline editable inputs within list items (like cart quantity and price) without specific `aria-label`s cause screen readers to announce disconnected generic inputs without item context, confusing visually impaired users.
**Action:** Always ensure inline editable inputs within list items have specific `aria-labels` that explicitly reference the item's name (e.g. "Cantidad de [Product Name]").

## 2026-03-25 - Select Dropdown Placeholder Clarity
**Learning:** Dropdowns (Select components) without placeholders can appear blank or confusing before a user interacts with them, similar to empty text inputs. They fail to convey what the dropdown controls.
**Action:** Always add a helpful `placeholder` prop to `<SelectValue>` to explicitly indicate what the dropdown is for (e.g. "Selecciona una categoria").

## 2026-03-26 - Visual Empty States
**Learning:** Empty states consisting only of text feel like dead ends or errors, especially in dashboards or active list views. Adding a relevant, explicit visual indicator (such as an `aria-hidden="true"` icon) alongside contextual guidance immediately improves usability and helps users recover or understand the application's current state.
**Action:** When creating or refactoring empty states, ensure they include an appropriate contextual icon (like `Receipt` or `Calendar`), a clear heading, and helpful guidance text explaining what should appear there or how to populate the view.

## 2026-03-26 - Clear Buttons in Search Inputs
**Learning:** Search inputs without a quick way to clear the text force users to manually delete characters one by one, increasing friction especially on mobile devices or with long queries. Adding a visible 'clear' button when the input has text significantly speeds up the workflow of starting a new search.
**Action:** Always include a 'clear search' (X) icon button inside search bars that appears when text is entered to provide a fast reset mechanism.

## 2026-03-30 - Mobile Search Keyboards
**Learning:** Using `inputMode="search"` on text inputs intended for searching changes the mobile keyboard's "Return" key to "Search", providing a better cue to the user, without the side effects of `type="search"` (like native clear buttons that conflict with custom ones). Additionally, search inputs without visible labels need `aria-label`s for screen reader accessibility.
**Action:** Always add `inputMode="search"`, `autoComplete="off"`, and a descriptive `aria-label` to custom search inputs.
