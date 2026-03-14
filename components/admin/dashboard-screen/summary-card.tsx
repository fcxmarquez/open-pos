import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export function SummaryCard({ label, value, icon: Icon, children }: SummaryCardProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <CardTitle className="text-3xl">{value}</CardTitle>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        {children}
      </CardHeader>
    </Card>
  );
}
