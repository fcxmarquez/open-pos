import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, es } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/config";

export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === "en" ? enUS : es;
}

export function getLongDatePattern(locale: Locale): string {
  return locale === "en" ? "EEEE, MMMM d, yyyy" : "EEEE, d 'de' MMMM 'de' yyyy";
}
