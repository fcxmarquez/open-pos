"use client"

import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Receipt,
  DollarSign,
  ShoppingCart,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function CorteScreen() {
  const [countedCash, setCountedCash] = useState("")
  const [showDetail, setShowDetail] = useState(false)

  const getTodaySales = useStore((s) => s.getTodaySales)
  const addReconciliation = useStore((s) => s.addReconciliation)
  const reconciliations = useStore((s) => s.reconciliations)

  const todaySales = getTodaySales()
  const systemTotal = todaySales.reduce((sum, s) => sum + s.total, 0)
  const itemsSold = todaySales.reduce(
    (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
    0
  )

  const countedNum = parseFloat(countedCash) || 0
  const difference = countedNum - systemTotal
  const hasCount = countedCash !== ""

  const todayDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const handleCloseRegister = () => {
    if (!hasCount) {
      toast.error("Ingresa el efectivo contado")
      return
    }
    if (
      window.confirm(
        "¿Cerrar el corte de caja del dia? Esta accion no se puede deshacer."
      )
    ) {
      addReconciliation(countedNum)
      toast.success("Corte de caja registrado")
      setCountedCash("")
    }
  }

  // History (exclude today's reconciliations from display if needed)
  const history = [...reconciliations]
    .sort(
      (a, b) =>
        new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
    )

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-4xl p-6">
        {/* Today's date */}
        <p className="mb-6 text-sm capitalize text-muted-foreground">
          {todayDate}
        </p>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventas realizadas
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{todaySales.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total registrado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(systemTotal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Articulos vendidos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{itemsSold}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cash count section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Conteo de efectivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="counted" className="text-base text-foreground">
                  Efectivo contado
                </Label>
                <Input
                  id="counted"
                  type="number"
                  step="0.01"
                  min="0"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="Ingresa la cantidad contada en caja"
                  className="mt-2 h-12 text-lg font-semibold text-foreground"
                />
              </div>

              {hasCount && (
                <div
                  className={`flex items-center gap-3 rounded-lg p-4 ${
                    difference === 0
                      ? "bg-accent/10"
                      : difference > 0
                        ? "bg-blue-50"
                        : "bg-amber-50"
                  }`}
                >
                  {difference === 0 ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                      <span className="text-lg font-semibold text-accent">
                        Cuadra perfecto
                      </span>
                    </>
                  ) : difference > 0 ? (
                    <>
                      <Info className="h-6 w-6 text-blue-600" />
                      <span className="text-lg font-semibold text-blue-600">
                        Sobrante: {formatCurrency(difference)}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                      <span className="text-lg font-semibold text-amber-600">
                        Faltante: {formatCurrency(Math.abs(difference))}
                      </span>
                    </>
                  )}
                </div>
              )}

              <Button
                size="lg"
                onClick={handleCloseRegister}
                disabled={!hasCount}
                className="w-full bg-primary text-primary-foreground text-base font-semibold"
              >
                Cerrar corte
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's sales detail */}
        <Collapsible open={showDetail} onOpenChange={setShowDetail}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="mb-3 w-full justify-between bg-transparent">
              <span>Detalle de ventas del dia ({todaySales.length})</span>
              {showDetail ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mb-6">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySales.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-6 text-center text-muted-foreground"
                        >
                          No hay ventas registradas hoy
                        </TableCell>
                      </TableRow>
                    ) : (
                      todaySales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-sm text-foreground">
                            {formatTime(sale.timestamp)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sale.items
                              .map(
                                (i) =>
                                  `${i.product.name} x${i.quantity}`
                              )
                              .join(", ")}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground">
                            {formatCurrency(sale.total)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Historial de cortes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">
                      Total sistema
                    </TableHead>
                    <TableHead className="text-right">
                      Total contado
                    </TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-sm text-foreground">
                        {formatDateShort(rec.date)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-foreground">
                        {formatCurrency(rec.systemTotal)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-foreground">
                        {formatCurrency(rec.countedTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.difference === 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-accent/10 text-accent"
                          >
                            Cuadra
                          </Badge>
                        ) : rec.difference > 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-600"
                          >
                            +{formatCurrency(rec.difference)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-50 text-amber-600"
                          >
                            {formatCurrency(rec.difference)}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
