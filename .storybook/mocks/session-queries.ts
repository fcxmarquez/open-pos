// Stubs for Storybook — "use server" actions are Node-only.
// Stories pre-seed the QueryClient directly, so these are never called at runtime.
export async function getOpenSession(): Promise<never> {
  throw new Error("getOpenSession should not be called in Storybook");
}

export async function getOpenSessionSales(): Promise<never> {
  throw new Error("getOpenSessionSales should not be called in Storybook");
}
