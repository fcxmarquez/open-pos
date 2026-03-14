import { isAuthBypassEnabled, TESTING_BYPASS_EMAIL } from "@/lib/auth/bypass";

export type AppRole = "admin" | "cashier";

export function normalizeEmails(rawValue: string | undefined): string[] {
  return (rawValue ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isTestingAdmin(email: string): boolean {
  return isAuthBypassEnabled() && email.toLowerCase() === TESTING_BYPASS_EMAIL;
}

export function getAdminEmails(): string[] {
  return normalizeEmails(process.env.ADMIN_EMAILS);
}

export function getRoleForEmail(email: string | null | undefined): AppRole {
  if (!email) {
    return "cashier";
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (isTestingAdmin(normalizedEmail)) {
    return "admin";
  }

  return getAdminEmails().includes(normalizedEmail) ? "admin" : "cashier";
}

export function isAdminRole(role: string | null | undefined): role is "admin" {
  return role === "admin";
}

export function getDefaultRouteForRole(role: string | null | undefined): string {
  return isAdminRole(role) ? "/admin/dashboard" : "/ventas";
}
