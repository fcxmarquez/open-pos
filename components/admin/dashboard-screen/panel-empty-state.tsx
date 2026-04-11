import type { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export function PanelEmptyState({
  icon: Icon,
  title,
  description,
  minHeight = "min-h-[200px]",
}: {
  icon: typeof Receipt;
  title: string;
  description: string;
  minHeight?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-6 text-center",
        minHeight
      )}
    >
      <Icon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
