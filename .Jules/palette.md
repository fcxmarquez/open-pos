## 2024-05-18 - Missing Accessibility Labels\n**Learning:** Icon-only buttons without ARIA labels are invisible to screen readers, making critical actions like 'remove item' inaccessible.\n**Action:** Always add aria-label to icon buttons, describing the action + the item it acts on.

## 2024-05-20 - Unhelpful Empty States
**Learning:** Empty states with just text feel like errors or dead ends. Adding a relevant icon and actionable guidance makes them feel like part of the application flow and helps users recover.
**Action:** Always include an icon, a clear heading, and actionable guidance in empty states.

## 2026-03-08 - Input Placeholder Clarity
**Learning:** Inputs without placeholders can be confusing, particularly when they are empty by default. Adding placeholders improves clarity by showing the user the format or a generic example of what is expected.
**Action:** Add helpful placeholders to empty inputs by default to guide user input.
