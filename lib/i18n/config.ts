export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/** Cookie name used to persist the user's language preference. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && locales.some((locale) => locale === value);
}

/** BCP 47 tags used for Intl / date-fns display formatting. */
export function toIntlLocale(locale: Locale): string {
  return locale === "en" ? "en-MX" : "es-MX";
}
