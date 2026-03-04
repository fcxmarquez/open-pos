"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calculator, CircleDot, LogOut, Package, ShoppingCart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import { openSessionQueryOptions } from "@/components/pos/corte-screen/query";
import { PinDialog } from "@/components/pos/pin-dialog";
import { ThemeToggle } from "@/components/pos/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Screen = "ventas" | "productos" | "corte";

const screenPaths: Record<Screen, string> = {
  ventas: "/ventas",
  productos: "/productos",
  corte: "/corte",
};

const SESSION_KEY = "pos-admin-unlocked";

const navItems = [
  {
    id: "ventas" as const,
    label: "Ventas",
    mobileLabel: "Ventas",
    icon: ShoppingCart,
    locked: false,
  },
  {
    id: "productos" as const,
    label: "Productos",
    mobileLabel: "Productos",
    icon: Package,
    locked: true,
  },
  {
    id: "corte" as const,
    label: "Corte de Caja",
    mobileLabel: "Corte",
    icon: Calculator,
    locked: true,
  },
];

function formatDate(): string {
  return format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

function pathToScreen(pathname: string): Screen {
  if (pathname.startsWith("/productos")) return "productos";
  if (pathname.startsWith("/corte")) return "corte";
  return "ventas";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeScreen = pathToScreen(pathname);

  const [mounted, setMounted] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<Screen | null>(null);
  const isLoggingOut = useRef(false);

  const [dateStr, setDateStr] = useState(formatDate);

  useEffect(() => {
    const timer = window.setInterval(() => setDateStr(formatDate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (isProtected && !adminUnlocked) {
      setPendingScreen(activeScreen);
      setPinDialogOpen(true);
    }
  }, [mounted, activeScreen, adminUnlocked]);

  const handleNavClick = (id: Screen) => {
    const item = navItems.find((n) => n.id === id);
    if (item?.locked && !adminUnlocked) {
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

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row md:gap-4 md:pr-4">
      <NavigationSidebar
        action={
          adminUnlocked
            ? {
                icon: LogOut,
                label: "Cerrar sesión",
                onSelect: requestLogout,
              }
            : null
        }
        allowExpandedDesktop={false}
        brandLabel="Papeleria Luna"
        defaultExpanded={false}
        items={navItems.map((item) => ({
          icon: item.icon,
          id: item.id,
          isActive: activeScreen === item.id,
          label: item.label,
          mobileLabel: item.mobileLabel,
          onSelect: () => handleNavClick(item.id),
        }))}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex flex-col gap-1.5 px-3 py-2 md:h-14 md:flex-row md:items-center md:gap-3 md:py-0">
          <h2 className="font-heading text-2xl font-extrabold text-foreground">
            {navItems.find((n) => n.id === activeScreen)?.label}
          </h2>

          <div className="hidden md:block md:flex-1" />

          <div className="flex items-center gap-2 md:gap-3">
            {/* Session badge */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 h-8">
              <CircleDot className="h-3.5 w-3.5 text-foreground" />
              {isSessionPending ? (
                <Spinner className="text-foreground" />
              ) : (
                <span className="font-body text-xs font-semibold text-foreground">
                  {openSession ? "Sesión abierta" : "Sin sesión"}
                </span>
              )}
            </div>

            {/* Date */}
            <div className="font-body text-xs font-semibold text-foreground capitalize md:w-[190px] md:text-right">
              {dateStr}
            </div>
            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Screen content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="border-t border-border bg-card p-2 md:hidden">
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

          {adminUnlocked && (
            <button
              type="button"
              onClick={requestLogout}
              className="flex h-14 w-14 shrink-0 flex-col items-center gap-1 justify-center rounded-xl text-xs font-medium transition-colors hover:bg-secondary text-muted-foreground"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </nav>

      {/* PIN Dialog */}
      <PinDialog
        open={pinDialogOpen}
        title={pendingScreen === null ? "Confirmar salida" : undefined}
        description={
          pendingScreen === null
            ? "Ingresa el PIN de administrador para cerrar sesión"
            : undefined
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
