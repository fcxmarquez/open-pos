export const DEMO_USER_EMAIL = "demo@preview.local";
export const DEMO_CREDENTIALS = { username: "demo", password: "demo" } as const;

/**
 * Demo mode requires TWO env vars to be set intentionally:
 *   DEMO_MODE=true
 *   DEMO_SECRET=<any non-empty value>
 *
 * A single stray DEMO_MODE=true on the production project is not enough
 * to activate the bypass — DEMO_SECRET acts as a second gate.
 * Never set DEMO_SECRET on the real production deployment.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" && Boolean(process.env.DEMO_SECRET);
}
