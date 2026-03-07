"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRightLeft,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { adminDashboardQueryOptions } from "@/components/admin/dashboard-screen/query";
import {
  MobileNavigationSidebar,
  MobileNavigationTrigger,
  NavigationSidebar,
} from "@/components/navigation-sidebar";
import { ThemeToggle, ThemeToggleSidebarRow } from "@/components/pos/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    icon: LayoutDashboard,
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    match: (pathname: string) => pathname.startsWith("/admin/dashboard"),
  },
  {
    icon: ArrowRightLeft,
    id: "ventas",
    label: "Ir a Ventas",
    path: "/ventas",
    match: (pathname: string) => pathname.startsWith("/ventas"),
  },
  {
    icon: Package,
    id: "productos",
    label: "Productos",
    path: "/productos",
    match: (pathname: string) => pathname.startsWith("/productos"),
  },
  {
    icon: WalletCards,
    id: "corte",
    label: "Corte de Caja",
    path: "/corte",
    match: (pathname: string) => pathname.startsWith("/corte"),
  },
] as const;

function formatShortDate(date: Date): string {
  return format(date, "d MMM yyyy", { locale: es });
}

function formatLongDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const {
    data: dashboardData,
    isError: hasDashboardStateError,
    isPending: isDashboardStatePending,
    isFetching: isDashboardFetching,
    refetch: refetchDashboard,
  } = useQuery(adminDashboardQueryOptions());

  const items = navItems.map((item) => ({
    icon: item.icon,
    id: item.id,
    isActive: item.match(pathname),
    label: item.label,
    onSelect: () => router.push(item.path),
  }));

  const logoutAction = {
    icon: LogOut,
    label: "Cerrar sesión",
    onSelect: () => signOut({ redirectTo: "/login" }),
    tone: "danger" as const,
  };

  const sessionControls = (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-2 text-xs font-semibold text-foreground">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            dashboardData?.hasOpenSession
              ? "bg-success-foreground"
              : !dashboardData && hasDashboardStateError
                ? "bg-destructive"
                : "bg-muted-foreground/50"
          )}
        />
        <span>
          {!dashboardData && isDashboardStatePending
            ? "Cargando estado..."
            : !dashboardData && hasDashboardStateError
              ? "Estado no disponible"
              : (dashboardData?.openSessionLabel ?? "Sin sesión abierta")}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => refetchDashboard()}
        disabled={isDashboardFetching}
        aria-label="Actualizar dashboard"
      >
        <RefreshCw className={cn("h-4 w-4", isDashboardFetching && "animate-spin")} />
      </Button>

      <ThemeToggle className="hidden md:flex" />
    </div>
  );

  return (
    <div
      className="flex min-h-screen flex-col bg-background md:grid md:transition-[grid-template-columns] md:duration-300 md:ease-in-out"
      style={
        {
          "--admin-sidebar-width": sidebarExpanded ? "15rem" : "4.5rem",
          gridTemplateColumns: "var(--admin-sidebar-width) minmax(0, 1fr)",
        } as React.CSSProperties
      }
    >
      <NavigationSidebar
        action={logoutAction}
        brandLabel="POS Admin"
        brandSubtitle="Papelería Luna"
        defaultExpanded
        expanded={sidebarExpanded}
        items={items}
        onExpandedChange={setSidebarExpanded}
      />

      <MobileNavigationSidebar
        action={logoutAction}
        brandLabel="POS Admin"
        brandSubtitle="Papelería Luna"
        footer={<ThemeToggleSidebarRow />}
        items={items}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />

      <div className="min-w-0 flex-1 transition-[width] duration-300 ease-in-out">
        <header className="hidden border-b bg-card md:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="space-y-1">
              <h1 className="text-2xl text-foreground">Dashboard</h1>
              <p className="text-sm capitalize text-muted-foreground">
                {formatLongDate(new Date())}
              </p>
            </div>

            {sessionControls}
          </div>
        </header>

        <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNavigationTrigger onClick={() => setMobileOpen(true)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Dashboard</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatShortDate(new Date())}
              </p>
            </div>
          </div>

          {sessionControls}
        </header>

        {children}
      </div>
    </div>
  );
}
