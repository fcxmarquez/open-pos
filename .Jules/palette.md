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

## 2026-03-09 - Mobile Currency Input UX
**Learning:** Using `type="number"` for currency inputs on mobile devices often shows a numeric keypad without decimal capabilities, confusing users. Adding `inputMode="decimal"` alongside `type="number"` ensures the OS presents the correct keypad with a decimal separator.
**Action:** Always include `inputMode="decimal"` on currency or decimal numeric inputs to improve the mobile input experience.
