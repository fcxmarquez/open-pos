"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
  Loader2,
  Package,
  Receipt,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { closeSession } from "@/app/actions/sessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CorteFormValues,
  corteFormDefaults,
  corteFormSchema,
} from "@/lib/pos-form-schemas";
import { formatCurrency } from "@/lib/utils";
import {
  sessionHistoryQueryKey,
  sessionHistoryQueryOptions,
  todaySalesQueryKey,
  todaySalesQueryOptions,
  todaySessionQueryKey,
  todaySessionQueryOptions,
} from "./query";

function formatTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CorteScreen() {
  const [showDetail, setShowDetail] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CorteFormValues>({
    resolver: zodResolver(corteFormSchema),
    defaultValues: corteFormDefaults,
  });

  const queryClient = useQueryClient();

  const { data: session, isLoading: isLoadingSession } = useQuery(
    todaySessionQueryOptions()
  );
  const { data: todaySales = [], isLoading: isLoadingSales } = useQuery(
    todaySalesQueryOptions()
  );
  const { data: sessionHistory = [], isLoading: isLoadingHistory } = useQuery(
    sessionHistoryQueryOptions()
  );

  const isLoading = isLoadingSession || isLoadingSales;
  const sessionIsClosed = session?.status === "closed";

  const systemTotal = Number(session?.systemTotal ?? 0);
  const itemsSold = todaySales.reduce(
    (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
    0
  );

  const countedCash = form.watch("countedCash");
  const countedNum = parseFloat(countedCash) || 0;
  const difference = countedNum - systemTotal;
  const hasCount = countedCash !== "";

  const todayDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleCloseRegister = (values: CorteFormValues) => {
    if (!session) {
      toast.error("No hay sesión activa para hoy");
      return;
    }

    const countedTotal = Number.parseFloat(values.countedCash);

    if (
      window.confirm("Cerrar el corte de caja del dia? Esta accion no se puede deshacer.")
    ) {
      startTransition(async () => {
        const result = await closeSession({
          sessionId: session.id,
          countedTotal,
        });

        if (result.success) {
          toast.success("Corte de caja registrado");
          form.reset(corteFormDefaults);
          queryClient.invalidateQueries({ queryKey: todaySessionQueryKey });
          queryClient.invalidateQueries({ queryKey: todaySalesQueryKey });
          queryClient.invalidateQueries({ queryKey: sessionHistoryQueryKey });
        } else {
          toast.error(result.error);
        }
      });
    }
  };

  // History: closed sessions excluding today's (shown separately)
  const todayStr = new Date().toISOString().slice(0, 10);
  const history = sessionHistory.filter(
    (s) => s.status === "closed" && s.sessionDate !== todayStr
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        {/* Today's date */}
        <p className="mb-4 text-sm capitalize text-muted-foreground md:mb-6">
          {todayDate}
        </p>

        {/* Summary cards */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:mb-6">
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
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Conteo de efectivo</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionIsClosed ? (
              <div className="flex items-center gap-3 rounded-lg bg-accent/10 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent sm:h-6 sm:w-6" />
                <div>
                  <span className="text-base font-semibold text-accent sm:text-lg">
                    Corte ya registrado
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contado: {formatCurrency(Number(session.countedTotal ?? 0))} &mdash;
                    Diferencia: {formatCurrency(Number(session.difference ?? 0))}
                  </p>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCloseRegister)}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={form.control}
                    name="countedCash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base text-foreground">
                          Efectivo contado
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="counted"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ingresa la cantidad contada en caja"
                            className="mt-2 h-12 text-lg font-semibold text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-accent sm:h-6 sm:w-6" />
                          <span className="text-base font-semibold text-accent sm:text-lg">
                            Cuadra perfecto
                          </span>
                        </>
                      ) : difference > 0 ? (
                        <>
                          <Info className="h-5 w-5 shrink-0 text-blue-600 sm:h-6 sm:w-6" />
                          <span className="text-base font-semibold text-blue-600 sm:text-lg">
                            Sobrante: {formatCurrency(difference)}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 sm:h-6 sm:w-6" />
                          <span className="text-base font-semibold text-amber-600 sm:text-lg">
                            Faltante: {formatCurrency(Math.abs(difference))}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={!hasCount || !session || isPending}
                    className="w-full bg-primary text-primary-foreground text-base font-semibold"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cerrando...
                      </>
                    ) : (
                      "Cerrar corte"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Today's sales detail */}
        <Collapsible open={showDetail} onOpenChange={setShowDetail}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="mb-3 w-full justify-between bg-transparent"
            >
              <span>Detalle de ventas del dia ({todaySales.length})</span>
              {showDetail ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mb-4 md:mb-6">
              <CardContent className="p-0">
                {/* Mobile: stacked cards */}
                <div className="divide-y md:hidden">
                  {todaySales.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      No hay ventas registradas hoy
                    </div>
                  ) : (
                    todaySales.map((sale) => (
                      <div key={sale.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {formatTime(sale.createdAt)}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(Number(sale.total))}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sale.items
                            .map((i) => `${i.productName} x${i.quantity}`)
                            .join(", ")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block">
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
                              {formatTime(sale.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sale.items
                                .map((i) => `${i.productName} x${i.quantity}`)
                                .join(", ")}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-foreground">
                              {formatCurrency(Number(sale.total))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* History */}
        {!isLoadingHistory && history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Historial de cortes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile: stacked cards */}
              <div className="divide-y md:hidden">
                {history.map((rec) => {
                  const diff = Number(rec.difference ?? 0);
                  return (
                    <div key={rec.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {formatDateShort(rec.sessionDate)}
                        </span>
                        {diff === 0 ? (
                          <Badge variant="secondary" className="bg-accent/10 text-accent">
                            Cuadra
                          </Badge>
                        ) : diff > 0 ? (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            +{formatCurrency(diff)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-50 text-amber-600"
                          >
                            {formatCurrency(diff)}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Sistema: {formatCurrency(Number(rec.systemTotal ?? 0))}
                        </span>
                        <span>
                          Contado: {formatCurrency(Number(rec.countedTotal ?? 0))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Total sistema</TableHead>
                      <TableHead className="text-right">Total contado</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((rec) => {
                      const diff = Number(rec.difference ?? 0);
                      return (
                        <TableRow key={rec.id}>
                          <TableCell className="text-sm text-foreground">
                            {formatDateShort(rec.sessionDate)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-foreground">
                            {formatCurrency(Number(rec.systemTotal ?? 0))}
                          </TableCell>
                          <TableCell className="text-right text-sm text-foreground">
                            {formatCurrency(Number(rec.countedTotal ?? 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {diff === 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-accent/10 text-accent"
                              >
                                Cuadra
                              </Badge>
                            ) : diff > 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-600"
                              >
                                +{formatCurrency(diff)}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-amber-50 text-amber-600"
                              >
                                {formatCurrency(diff)}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
