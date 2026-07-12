"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import { cn } from "@/lib/utils";

interface StaleSessionBannerProps {
  staleSession: {
    sessionDate: string;
    sessionNumber: number;
  };
  onDismiss?: () => void;
  className?: string;
}

export function StaleSessionBanner({
  staleSession,
  onDismiss,
  className,
}: StaleSessionBannerProps) {
  const t = useTranslations("admin.stale");
  const locale = useLocale() as Locale;

  const sessionDateLabel = format(
    new Date(`${staleSession.sessionDate}T12:00:00`),
    locale === "en" ? "MMMM d" : "d 'de' MMMM",
    { locale: getDateFnsLocale(locale) }
  );

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border border-warning-border/45 bg-card px-4 py-3 text-foreground shadow-xs",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="chip" variant="warning">
              {t("badge")}
            </Badge>
            <span className="text-xs text-muted-foreground">{t("hint")}</span>
          </div>

          <p className="text-sm leading-5">
            {t("message", {
              date: sessionDateLabel,
              number: staleSession.sessionNumber,
            })}
          </p>
        </div>
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("dismissAria")}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
