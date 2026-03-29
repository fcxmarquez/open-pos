// Stub for Storybook — "use server" action uses database which is Node-only.
// Form submission is not triggered in visual stories.
export async function closeSession(_input: {
  sessionId: string;
  countedTotal: number;
}): Promise<never> {
  throw new Error("closeSession should not be called in Storybook");
}
