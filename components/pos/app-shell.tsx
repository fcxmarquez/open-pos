"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Package,
  Calculator,
  Store,
  Menu,
  X,
  LogOut,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { VentasScreen } from "./ventas-screen"
import { ProductosScreen } from "./productos-screen"
import { CorteScreen } from "./corte-screen"
import { PinDialog } from "./pin-dialog"

type Screen = "ventas" | "productos" | "corte"

function formatDate(): string {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<Screen>("ventas")
  const [mounted, setMounted] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [pendingScreen, setPendingScreen] = useState<Screen | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { id: "ventas" as const, label: "Ventas", icon: ShoppingCart, locked: false },
    { id: "productos" as const, label: "Productos", icon: Package, locked: true },
    { id: "corte" as const, label: "Corte de Caja", icon: Calculator, locked: true },
  ]

  const handleNavClick = (id: Screen) => {
    const item = navItems.find((n) => n.id === id)
    if (item?.locked && !adminUnlocked) {
      setPendingScreen(id)
      setPinDialogOpen(true)
      return
    }
    setActiveScreen(id)
    setMobileNavOpen(false)
  }

  const handlePinSuccess = () => {
    setAdminUnlocked(true)
    if (pendingScreen) {
      setActiveScreen(pendingScreen)
      setPendingScreen(null)
    }
    setMobileNavOpen(false)
  }

  const handleLogout = () => {
    setAdminUnlocked(false)
    setActiveScreen("ventas")
    setMobileNavOpen(false)
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileNavOpen(false)
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:static md:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-sidebar-primary" />
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">
                Papeleria Luna
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Punto de Venta</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id
            const showLock = item.locked && !adminUnlocked
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {showLock && <Lock className="h-3.5 w-3.5 text-sidebar-foreground/40" />}
              </button>
            )
          })}
        </nav>

        {/* Logout button */}
        {adminUnlocked && (
          <div className="border-t border-sidebar-border px-2 py-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesion
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
            <h2 className="text-base font-semibold text-foreground md:text-lg">
              {navItems.find((n) => n.id === activeScreen)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm capitalize text-muted-foreground sm:block">
              {formatDate()}
            </div>
            {adminUnlocked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                title="Cerrar sesion"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Cerrar sesion</span>
              </Button>
            )}
          </div>
        </header>

        {/* Screen content */}
        <main className="flex-1 overflow-hidden">
          {activeScreen === "ventas" && <VentasScreen />}
          {activeScreen === "productos" && <ProductosScreen />}
          {activeScreen === "corte" && <CorteScreen />}
        </main>
      </div>

      {/* PIN Dialog */}
      <PinDialog
        open={pinDialogOpen}
        onOpenChange={(open) => {
          setPinDialogOpen(open)
          if (!open) setPendingScreen(null)
        }}
        onSuccess={handlePinSuccess}
      />
    </div>
  )
}
