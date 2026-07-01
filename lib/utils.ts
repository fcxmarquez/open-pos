import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Formats a Date as "HH:mm" (e.g. "14:30"). */
export function formatTime(timestamp: Date): string {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return format(d, "HH:mm", { locale: es });
}

/** Formats a date string as "dd MMM yyyy" (e.g. "15 ene 2025"). */
export function formatDateShort(dateStr: string): string {
  return format(new Date(`${dateStr}T12:00:00`), "dd MMM yyyy", { locale: es });
}

/** Formats an optional ISO date string as "dd MMM yyyy", returns "Nunca" if empty. */
export function formatDateLabel(dateStr: string | undefined): string {
  if (!dateStr) return "Nunca";
  return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
}

/** Formats a Date as "YYYY-MM-DD" in Mexico City timezone. */
export function toMexicoDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Returns today's date as "YYYY-MM-DD" in Mexico City timezone. */
export function getTodayDateString(): string {
  return toMexicoDateString(new Date());
}

/**
 * Returns the day-of-month and total days in that month for a "YYYY-MM-DD"
 * date string. Derived from the date string itself (not `new Date()`) so it
 * stays correct regardless of the runtime's local timezone.
 */
export function getMonthProgress(dateString: string): {
  monthDaysElapsed: number;
  monthDaysTotal: number;
} {
  const [year, month, day] = dateString.split("-").map(Number);
  const monthDaysTotal = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { monthDaysElapsed: day, monthDaysTotal };
}

/**
 * Anchors a Date on Mexico City's calendar date, reconstructed as noon in
 * the current runtime's local time (not noon UTC — plain "YYYY-MM-DDTHH:mm:ss"
 * strings parse as local time per the Date Time String Format). Since callers
 * format the result with local getters too, server (UTC) and client renders
 * produce the same calendar-date string regardless of either runtime's
 * timezone offset.
 */
export function mexicoAnchoredDate(date: Date): Date {
  const [year, month, day] = toMexicoDateString(date).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
