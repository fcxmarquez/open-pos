## 2025-04-03 - Added SubmitButton component
**Learning:** For server actions attached to form submissions, adding a loading state prevents accidental double clicks and provides necessary visual feedback to the user when the request is processing. Since `useFormStatus()` only works in client components and specifically within a `<form>` element, we extracted the submit button into a reusable `components/pos/login/submit-button.tsx` component that consumes the pending status and renders a loading spinner.
**Action:** Use this `<SubmitButton>` component inside forms instead of a standard `<Button type="submit">` whenever visual feedback during server action submissions is needed.

## 2025-04-03 - Added SubmitButton component
**Learning:** For server actions attached to form submissions, adding a loading state prevents accidental double clicks and provides necessary visual feedback to the user when the request is processing. Since `useFormStatus()` only works in client components and specifically within a `<form>` element, we extracted the submit button into a reusable `components/pos/login/submit-button.tsx` component that consumes the pending status and renders a loading spinner.
**Action:** Use this `<SubmitButton>` component inside forms instead of a standard `<Button type="submit">` whenever visual feedback during server action submissions is needed.
