import type { Locale } from "@/lib/i18n/config";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
  }
}
