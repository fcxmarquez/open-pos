"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CircleDot,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import { openSessionQueryOptions } from "@/components/pos/corte-screen/query";
import { DemoBanner } from "@/components/pos/demo-banner";
import { LanguageSwitcher } from "@/components/pos/language-switcher";
import { PinDialog } from "@/components/pos/pin-dialog";
import { ThemeToggle } from "@/components/pos/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { STORE_NAME } from "@/lib/constants/store";
import type { Locale } from "@/lib/i18n/config";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import { cn } from "@/lib/utils";

type Screen = "ventas" | "productos" | "corte";

const screenPaths: Record<Screen, string> = {
  ventas: "/ventas",
  productos: "/productos",
  corte: "/corte",
};

const SESSION_KEY = "pos-admin-unlocked";

function pathToScreen(pathname: string): Screen {
  if (pathname.startsWith("/productos")) return "productos";
  if (pathname.startsWith("/corte")) return "corte";
  return "ventas";
}

export function AppShell({
  children,
  isAdmin = false,
  isDemoMode = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  isDemoMode?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const activeScreen = pathToScreen(pathname);

  const [mounted, setMounted] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<Screen | null>(null);
  const isLoggingOut = useRef(false);

  const headerDatePattern =
    locale === "en" ? "EEEE, MMMM d, yyyy" : "EEEE, d 'de' MMMM 'de' yyyy";
  const dateFnsLocale = getDateFnsLocale(locale);

  const [dateStr, setDateStr] = useState(() =>
    format(new Date(), headerDatePattern, { locale: dateFnsLocale })
  );
  const canAccessProtectedScreens = isDemoMode || isAdmin || adminUnlocked;

  const navItems = [
    {
      id: "ventas" as const,
      label: t("nav.ventas"),
      mobileLabel: t("nav.ventas"),
      icon: ShoppingCart,
      locked: false,
    },
    {
      id: "productos" as const,
      label: t("nav.productos"),
      mobileLabel: t("nav.productos"),
      icon: Package,
      locked: true,
    },
    {
      id: "corte" as const,
      label: t("nav.corte"),
      mobileLabel: t("nav.corteMobile"),
      icon: WalletCards,
      locked: true,
    },
  ];

  useEffect(() => {
    const updateDate = () =>
      setDateStr(format(new Date(), headerDatePattern, { locale: dateFnsLocale }));
    updateDate();
    const timer = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(timer);
  }, [headerDatePattern, dateFnsLocale]);

  const { data: openSession, isPending: isSessionPending } = useQuery(
    openSessionQueryOptions()
  );

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setAdminUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isLoggingOut.current) {
      isLoggingOut.current = false;
      return;
    }
    const isProtected = activeScreen === "productos" || activeScreen === "corte";
    if (isProtected && !canAccessProtectedScreens) {
      setPendingScreen(activeScreen);
      setPinDialogOpen(true);
    }
  }, [mounted, activeScreen, canAccessProtectedScreens]);

  const handleNavClick = (id: Screen) => {
    const item = navItems.find((n) => n.id === id);
    if (item?.locked && !canAccessProtectedScreens) {
      setPendingScreen(id);
      setPinDialogOpen(true);
      return;
    }
    router.push(screenPaths[id]);
  };

  const performLogout = () => {
    isLoggingOut.current = true;
    sessionStorage.removeItem(SESSION_KEY);
    setAdminUnlocked(false);
    signOut({ redirectTo: "/login" });
  };

  const handlePinSuccess = () => {
    if (pendingScreen === null) {
      performLogout();
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setAdminUnlocked(true);
    router.push(screenPaths[pendingScreen]);
    setPendingScreen(null);
  };

  const requestLogout = () => {
    setPinDialogOpen(true);
  };

  const logoutAction = {
    icon: LogOut,
    label: t("nav.logout"),
    onSelect: adminUnlocked ? requestLogout : performLogout,
  };

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row md:gap-4 md:pr-4">
      <NavigationSidebar
        action={isDemoMode ? null : logoutAction}
        allowExpandedDesktop={false}
        brandLabel={STORE_NAME}
        defaultExpanded={false}
        items={[
          ...navItems.map((item) => ({
            icon: item.icon,
            id: item.id,
            isActive: activeScreen === item.id,
            label: item.label,
            mobileLabel: item.mobileLabel,
            onSelect: () => handleNavClick(item.id),
          })),
          ...(isAdmin
            ? [
                {
                  dividerBefore: true,
                  icon: LayoutDashboard,
                  id: "admin",
                  isActive: false,
                  label: t("nav.adminPanel"),
                  onSelect: () => router.push("/admin/dashboard"),
                },
              ]
            : []),
        ]}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-col gap-1.5 px-3 py-2 md:h-14 md:flex-row md:items-center md:gap-3 md:py-0">
          <h2 className="font-heading text-2xl font-extrabold text-foreground">
            {navItems.find((n) => n.id === activeScreen)?.label}
          </h2>

          <div className="hidden md:block md:flex-1" />

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 h-8">
              <CircleDot className="h-3.5 w-3.5 text-foreground" />
              {isSessionPending ? (
                <Spinner className="text-foreground" />
              ) : (
                <span className="font-body text-xs font-semibold text-foreground">
                  {openSession ? t("common.sessionOpen") : t("common.noSession")}
                </span>
              )}
            </div>

            <div className="font-body text-xs font-semibold text-foreground capitalize md:w-[190px] md:text-right">
              {dateStr}
            </div>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {isDemoMode && <DemoBanner />}

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      <nav className="border-t border-border bg-card p-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] md:hidden">
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4" />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}

          {isAdmin ? (
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("nav.adminPanel")}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t("nav.adminPanel")}</span>
            </button>
          ) : null}

          {!isDemoMode && (
            <button
              type="button"
              onClick={logoutAction.onSelect}
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logoutMobile")}</span>
            </button>
          )}
        </div>
      </nav>

      <PinDialog
        open={pinDialogOpen}
        title={pendingScreen === null ? t("auth.pin.confirmLogoutTitle") : undefined}
        description={
          pendingScreen === null ? t("auth.pin.confirmLogoutDescription") : undefined
        }
        onOpenChange={(open) => {
          setPinDialogOpen(open);
          if (!open) setPendingScreen(null);
        }}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
}
