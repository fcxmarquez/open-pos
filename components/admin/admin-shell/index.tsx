"use client";

import {
  ArrowRightLeft,
  LayoutDashboard,
  LogOut,
  Package,
  WalletCards,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  MobileNavigationSidebar,
  MobileNavigationTrigger,
  NavigationSidebar,
} from "@/components/navigation-sidebar";
import { Button } from "@/components/ui/button";

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

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

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
        items={items}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />

      <div className="min-w-0 flex-1 transition-[width] duration-300 ease-in-out">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <MobileNavigationTrigger onClick={() => setMobileOpen(true)} />
            <div>
              <p className="text-sm font-semibold text-foreground">POS Admin</p>
              <p className="text-xs text-muted-foreground">Papelería Luna</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={logoutAction.onSelect}
            aria-label="Cerrar sesión"
            className="h-10 w-10 rounded-xl text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {children}
      </div>
    </div>
  );
}
