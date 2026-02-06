"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Package,
  Calculator,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { VentasScreen } from "./ventas-screen"
import { ProductosScreen } from "./productos-screen"
import { CorteScreen } from "./corte-screen"

type Screen = "ventas" | "productos" | "corte"

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

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
  const getTodayTotal = useStore((s) => s.getTodayTotal)
  const initialized = useStore((s) => s._initialized)

  useEffect(() => {
    setMounted(true)
  }, [])

  const todayTotal = mounted && initialized ? getTodayTotal() : 0

  const navItems = [
    { id: "ventas" as const, label: "Ventas", icon: ShoppingCart },
    { id: "productos" as const, label: "Productos", icon: Package },
    { id: "corte" as const, label: "Corte de Caja", icon: Calculator },
  ]

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <Store className="h-6 w-6 text-sidebar-primary" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">Papeleria Luna</h1>
            <p className="text-xs text-sidebar-foreground/60">Punto de Venta</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-xs text-sidebar-foreground/50">Ventas del dia</p>
          <p className="text-lg font-bold text-sidebar-primary">
            {formatCurrency(todayTotal)}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b bg-card px-6 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            {navItems.find((n) => n.id === activeScreen)?.label}
          </h2>
          <div className="text-sm capitalize text-muted-foreground">
            {formatDate()}
          </div>
        </header>

        {/* Screen content */}
        <main className="flex-1 overflow-hidden">
          {activeScreen === "ventas" && <VentasScreen />}
          {activeScreen === "productos" && <ProductosScreen />}
          {activeScreen === "corte" && <CorteScreen />}
        </main>
      </div>
    </div>
  )
}
