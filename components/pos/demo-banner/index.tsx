import { Eye } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg border border-info-border bg-info px-3 py-2">
      <Eye className="h-3.5 w-3.5 shrink-0 text-info-foreground" />
      <p className="font-body text-xs font-medium text-info-foreground">
        Vista previa — Explora todas las funciones libremente. Los datos son de ejemplo y
        no afectan el sistema real.
      </p>
    </div>
  );
}
