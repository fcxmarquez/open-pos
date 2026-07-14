"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale, locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function setLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  // Cookie Store API is not available in all browsers; cookie is required for
  // server-readable locale with unchanged URLs.
  // biome-ignore lint/suspicious/noDocumentCookie: intentional locale persistence for next-intl
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};samesite=lax`;
}

function useLocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => {
      router.refresh();
    });
  };

  return { isPending, locale, switchLocale };
}

export function LanguageSwitcherSidebarRow() {
  const t = useTranslations("common");
  const { isPending, locale, switchLocale } = useLocaleSwitcher();

  return (
    <fieldset className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2">
      <legend className="sr-only">{t("language")}</legend>
      <span className="text-sm font-medium text-muted-foreground" aria-hidden="true">
        {t("language")}
      </span>
      <div className="ml-auto flex items-center gap-1">
        {locales.map((code) => {
          const selected = code === locale;
          return (
            <button
              key={code}
              type="button"
              disabled={isPending}
              onClick={() => switchLocale(code)}
              aria-pressed={selected}
              className={cn(
                "rounded-lg px-2 py-1 text-xs font-semibold uppercase transition-colors",
                selected
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              {code === "es" ? "ES" : "EN"}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { isPending, locale, switchLocale } = useLocaleSwitcher();

  return (
    <fieldset
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border p-0.5",
        className
      )}
    >
      <legend className="sr-only">{t("language")}</legend>
      {locales.map((code) => {
        const selected = code === locale;
        return (
          <button
            key={code}
            type="button"
            disabled={isPending}
            onClick={() => switchLocale(code)}
            aria-pressed={selected}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-semibold uppercase transition-colors",
              selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {code === "es" ? "ES" : "EN"}
          </button>
        );
      })}
    </fieldset>
  );
}
