"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale, locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function setLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};samesite=lax`;
}

export function LanguageSwitcherSidebarRow() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div
      className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2"
      aria-label={t("language")}
    >
      <span className="text-sm font-medium text-muted-foreground">{t("language")}</span>
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
    </div>
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border p-0.5",
        className
      )}
      aria-label={t("language")}
      role="group"
    >
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
    </div>
  );
}
