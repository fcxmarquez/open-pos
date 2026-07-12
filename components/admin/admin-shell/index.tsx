"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRightLeft, LayoutDashboard, LogOut, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { adminDashboardQueryOptions } from "@/components/admin/dashboard-screen/query";
import {
  MobileNavigationSidebar,
  MobileNavigationTrigger,
  NavigationSidebar,
} from "@/components/navigation-sidebar";
import { DemoBanner } from "@/components/pos/demo-banner";
import {
  LanguageSwitcher,
  LanguageSwitcherSidebarRow,
} from "@/components/pos/language-switcher";
import { ThemeToggle, ThemeToggleSidebarRow } from "@/components/pos/theme-toggle";
import { Button } from "@/components/ui/button";
import { STORE_NAME } from "@/lib/constants/store";
import type { Locale } from "@/lib/i18n/config";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import { cn, mexicoAnchoredDate } from "@/lib/utils";

export function AdminShell({
  children,
  isDemoMode = false,
}: {
  children: React.ReactNode;
  isDemoMode?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
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
  } = useQuery(adminDashboardQueryOptions(locale));

  const formatShortDate = (date: Date) =>
    format(mexicoAnchoredDate(date), "d MMM yyyy", { locale: getDateFnsLocale(locale) });

  const formatLongDate = (date: Date) =>
    format(
      mexicoAnchoredDate(date),
      locale === "en" ? "EEEE, MMMM d, yyyy" : "EEEE, d 'de' MMMM 'de' yyyy",
      { locale: getDateFnsLocale(locale) }
    );

  const navItems = [
    {
      icon: LayoutDashboard,
      id: "dashboard",
      label: t("nav.dashboard"),
      path: "/admin/dashboard",
      match: (path: string) => path.startsWith("/admin/dashboard"),
    },
    {
      icon: ArrowRightLeft,
      id: "ventas",
      label: t("nav.goToVentas"),
      path: "/ventas",
      match: (path: string) => path.startsWith("/ventas"),
    },
  ] as const;

  const items = navItems.map((item) => ({
    icon: item.icon,
    id: item.id,
    isActive: item.match(pathname),
    label: item.label,
    onSelect: () => router.push(item.path),
  }));

  const logoutAction = {
    icon: LogOut,
    label: t("nav.logout"),
    onSelect: () => signOut({ redirectTo: "/login" }),
  };

  const sidebarFooter = (
    <div className="flex w-full flex-col gap-1">
      <LanguageSwitcherSidebarRow />
      <ThemeToggleSidebarRow />
    </div>
  );

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
            ? t("common.loadingState")
            : !dashboardData && hasDashboardStateError
              ? t("common.stateUnavailable")
              : (dashboardData?.openSessionLabel ?? t("common.noOpenSession"))}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => refetchDashboard()}
        disabled={isDashboardFetching}
        aria-label={t("common.refreshDashboard")}
      >
        <RefreshCw className={cn("h-4 w-4", isDashboardFetching && "animate-spin")} />
      </Button>

      <LanguageSwitcher className="hidden md:inline-flex" />
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
        action={isDemoMode ? null : logoutAction}
        brandLabel={t("common.posAdmin")}
        brandSubtitle={STORE_NAME}
        defaultExpanded
        expanded={sidebarExpanded}
        footer={sidebarExpanded ? sidebarFooter : undefined}
        items={items}
        onExpandedChange={setSidebarExpanded}
      />

      <MobileNavigationSidebar
        action={isDemoMode ? null : logoutAction}
        brandLabel={t("common.posAdmin")}
        brandSubtitle={STORE_NAME}
        footer={sidebarFooter}
        items={items}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />

      <div className="min-w-0 flex-1 transition-[width] duration-300 ease-in-out">
        <header className="hidden border-b bg-card md:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="space-y-1">
              <h1 className="text-2xl text-foreground">{t("nav.dashboard")}</h1>
              <p
                className="text-sm capitalize text-muted-foreground"
                suppressHydrationWarning
              >
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
              <p className="truncate text-sm font-semibold text-foreground">
                {t("nav.dashboard")}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {formatShortDate(new Date())}
              </p>
            </div>
          </div>

          {sessionControls}
        </header>

        {isDemoMode && (
          <div className="px-4 pt-3 md:px-8">
            <DemoBanner />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
