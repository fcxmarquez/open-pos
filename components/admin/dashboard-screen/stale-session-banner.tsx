"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StaleSessionBannerProps {
  staleSession: {
    sessionDate: string;
    sessionNumber: number;
  };
  onDismiss?: () => void;
  className?: string;
}

function formatSessionDate(sessionDate: string): string {
  return format(new Date(`${sessionDate}T12:00:00`), "d 'de' MMMM", {
    locale: es,
  });
}

export function StaleSessionBanner({
  staleSession,
  onDismiss,
  className,
}: StaleSessionBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border border-warning-border/45 bg-card px-4 py-3 text-foreground shadow-sm",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="chip" variant="warning">
              Corte pendiente
            </Badge>
            <span className="text-xs text-muted-foreground">
              Se cerrará con la próxima venta.
            </span>
          </div>

          <p className="text-sm leading-5">
            El corte del{" "}
            <span className="font-semibold">
              {formatSessionDate(staleSession.sessionDate)}
            </span>{" "}
            (Turno <span className="font-semibold">{staleSession.sessionNumber}</span>) no
            fue cerrado.
          </p>
        </div>
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Descartar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
