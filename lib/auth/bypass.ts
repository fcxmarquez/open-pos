export const TESTING_BYPASS_EMAIL = "test@testing.local";

export function isAuthBypassEnabled(): boolean {
  if (process.env.AUTH_BYPASS !== "true") {
    return false;
  }

  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV !== "production";
  }

  return process.env.NODE_ENV !== "production";
}
