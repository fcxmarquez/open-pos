import type { z } from "zod";

export type ActionResult<T = null> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export function formatZodError(
  error: z.ZodError,
  fallbackMessage = "Datos de entrada inválidos"
): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message ?? fallbackMessage;
}
