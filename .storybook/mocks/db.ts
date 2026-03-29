// Stub for Storybook — the real db/index.ts requires DATABASE_URL env var.
// Server action mocks ensure db is never called, but this prevents the module
// from throwing during import in the Vite module graph.
export const db = null;
