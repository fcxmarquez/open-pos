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

/** Returns today's date as "YYYY-MM-DD" in Mexico City timezone. */
export function getTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
