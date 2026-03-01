"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calculator,
  CircleDot,
  LogOut,
  Package,
  ShoppingCart,
  Store,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { openSessionQueryOptions } from "@/components/pos/corte-screen/query";
import { PinDialog } from "@/components/pos/pin-dialog";
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

  const dateStr = useMemo(formatDate, []);

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
      {/* Sidebar */}
      <aside className="hidden w-[72px] flex-col border-r border-sidebar-border bg-sidebar px-2 pb-3.5 pt-3 md:flex">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-full items-center justify-center">
            <Store className="h-5 w-5 text-sidebar-foreground" />
            <span className="sr-only">Papeleria Luna</span>
          </div>
          <div className="h-px w-6 bg-border" />
        </div>
        <nav className="mt-3 flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "flex h-10 w-[46px] items-center justify-center rounded-xl border text-muted-foreground transition-colors",
                  isActive
                    ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-transparent bg-transparent hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Logout button */}
        {adminUnlocked && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={requestLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-10 w-[46px] items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </button>
          </div>
        )}
      </aside>

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
