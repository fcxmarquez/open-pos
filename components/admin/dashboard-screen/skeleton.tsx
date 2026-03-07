import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SUMMARY_SKELETON_KEYS = [
  "admin-dashboard-card-skeleton-1",
  "admin-dashboard-card-skeleton-2",
  "admin-dashboard-card-skeleton-3",
  "admin-dashboard-card-skeleton-4",
] as const;

const PANEL_SKELETON_KEYS = [
  "admin-dashboard-panel-skeleton-1",
  "admin-dashboard-panel-skeleton-2",
] as const;

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {SUMMARY_SKELETON_KEYS.map((key) => (
          <Card key={key} className="rounded-3xl">
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        {PANEL_SKELETON_KEYS.map((key) => (
          <Card key={key} className="rounded-3xl">
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-3xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
