"use client";

import { Calculator, LogOut, Package, ShoppingCart, Store } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { PinDialog } from "@/components/pos/pin-dialog";
import { cn } from "@/lib/utils";

type Screen = "ventas" | "productos" | "corte";
type PinIntent = "unlock" | "logout";

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
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  const [pinIntent, setPinIntent] = useState<PinIntent>("unlock");
  const isLoggingOut = useRef(false);

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
      setPinIntent("unlock");
      setPendingScreen(activeScreen);
      setPinDialogOpen(true);
    }
  }, [mounted, activeScreen, adminUnlocked]);

  const handleNavClick = (id: Screen) => {
    const item = navItems.find((n) => n.id === id);
    if (item?.locked && !adminUnlocked) {
      setPinIntent("unlock");
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
    if (pinIntent === "logout") {
      performLogout();
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setAdminUnlocked(true);
    if (pendingScreen) {
      router.push(screenPaths[pendingScreen]);
      setPendingScreen(null);
    }
  };

  const requestLogout = () => {
    setPinIntent("logout");
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
      <aside className="hidden w-[72px] flex-col border-r border-[#E5E7EB] bg-white px-2 pb-[14px] pt-3 md:flex">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-full items-center justify-center">
            <Store className="h-[22px] w-[22px] text-black" />
            <span className="sr-only">Papeleria Luna</span>
          </div>
          <div className="h-px w-6 bg-[#F1F5F9]" />
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
                  "flex h-10 w-[46px] items-center justify-center rounded-[12px] border text-[#9CA3AF] transition-colors",
                  isActive
                    ? "border-[#E4E4E7] bg-[#F4F4F5] text-black"
                    : "border-transparent bg-transparent hover:bg-[#F8FAFC] hover:text-[#6B7280]"
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
              className="flex h-10 w-[46px] items-center justify-center rounded-[12px] border border-transparent text-[#9CA3AF] transition-colors hover:bg-[#F8FAFC] hover:text-[#6B7280]"
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
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold text-foreground md:text-lg">
              {navItems.find((n) => n.id === activeScreen)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm capitalize text-muted-foreground sm:block">
              {formatDate()}
            </div>
          </div>
        </header>

        {/* Screen content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="border-t border-[#E5E7EB] bg-white p-2 md:hidden">
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
                  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-[#F4F4F5] text-black"
                    : "text-[#9CA3AF] hover:bg-[#F8FAFC] hover:text-[#6B7280]"
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
              className="flex h-14 w-14 shrink-0 flex-col items-center gap-1 justify-center rounded-xl text-[11px] font-medium transition-colors text-[#9CA3AF] hover:bg-[#F8FAFC] hover:text-[#6B7280]"
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
        title={pinIntent === "logout" ? "Confirmar salida" : undefined}
        description={
          pinIntent === "logout"
            ? "Ingresa el PIN de administrador para cerrar sesión"
            : undefined
        }
        onOpenChange={(open) => {
          setPinDialogOpen(open);
          if (!open) {
            setPendingScreen(null);
            setPinIntent("unlock");
          }
        }}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
}
