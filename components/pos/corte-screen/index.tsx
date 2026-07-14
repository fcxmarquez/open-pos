"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  DollarSign,
  Info,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { closeSession } from "@/app/actions/sessions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
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
  createCorteFormSchema,
} from "@/lib/pos-form-schemas";
import { cn, formatCurrency, formatDateShort, formatTime } from "@/lib/utils";
import {
  openSessionQueryKey,
  openSessionQueryOptions,
  openSessionSalesQueryKey,
  openSessionSalesQueryOptions,
} from "./query";

const surfaceCardClass = "overflow-hidden rounded-2xl border border-border bg-card";
const tableHeadClass = "h-12 px-5 font-body text-xs font-semibold text-muted-foreground";

function SalesEmptyState() {
  const t = useTranslations("corte.empty");

  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      <Receipt className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-sm font-semibold text-foreground">{t("title")}</p>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  isCurrency = false,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
  isCurrency?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-body text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
      </div>
      <p
        className={cn(
          "mt-2 font-heading font-extrabold leading-none tracking-[-0.03em] text-foreground tabular-nums",
          isCurrency ? "text-2xl" : "text-3xl"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CorteScreen() {
  const t = useTranslations("corte");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const [showDetail, setShowDetail] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<CorteFormValues | null>(null);
  const corteFormSchema = useMemo(
    () => createCorteFormSchema(tValidation),
    [tValidation]
  );
  const form = useForm<CorteFormValues>({
    resolver: zodResolver(corteFormSchema),
    defaultValues: corteFormDefaults,
  });

  const queryClient = useQueryClient();

  const { data: session, isLoading: isLoadingSession } = useQuery(
    openSessionQueryOptions()
  );
  const { data: openSessionSales = [], isLoading: isLoadingSales } = useQuery(
    openSessionSalesQueryOptions()
  );
  const isLoading = isLoadingSession || isLoadingSales;

  const systemTotal = Number(session?.systemTotal ?? 0);
  const itemsSold = openSessionSales.reduce(
    (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
    0
  );

  const countedCash = form.watch("countedCash");
  const countedNum = parseFloat(countedCash) || 0;
  const difference = countedNum - systemTotal;
  const hasCount = countedCash !== "";
  const isValidCount = hasCount && countedNum >= 0;

  const handleCloseRegister = (values: CorteFormValues) => {
    if (!session) {
      toast.error(t("toast.noSession"));
      return;
    }
    setPendingValues(values);
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    if (!session || !pendingValues) return;
    const countedTotal = Number.parseFloat(pendingValues.countedCash);
    startTransition(async () => {
      const result = await closeSession({
        sessionId: session.id,
        countedTotal,
      });

      if (result.success) {
        toast.success(t("toast.success"));
        form.reset(corteFormDefaults);
        queryClient.invalidateQueries({ queryKey: openSessionQueryKey });
        queryClient.invalidateQueries({ queryKey: openSessionSalesQueryKey });
      } else {
        toast.error(result.error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-[980px] flex-col gap-3 px-4 py-4 md:px-5">
        <p className="font-body text-xs font-medium text-muted-foreground">
          {session
            ? tCommon("sessionCurrent", {
                date: formatDateShort(session.sessionDate, locale),
                number: session.sessionNumber,
              })
            : tCommon("noActiveSession")}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <SummaryCard
            icon={Receipt}
            label={t("summary.salesCount")}
            value={String(openSessionSales.length)}
          />
          <SummaryCard
            icon={DollarSign}
            isCurrency
            label={t("summary.systemTotal")}
            value={formatCurrency(systemTotal, locale)}
          />
          <SummaryCard
            icon={Package}
            label={t("summary.itemsSold")}
            value={String(itemsSold)}
          />
        </div>

        <div className={cn(surfaceCardClass, "p-3.5")}>
          {!session ? (
            <div className="rounded-2xl bg-muted/50 px-4 py-5">
              <div className="flex items-start gap-3">
                <CircleDot
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tCommon("noActiveSession")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("noSessionHint")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCloseRegister)}
                className="flex flex-col gap-2.5"
              >
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {t("cashCount.title")}
                </h3>

                <FormField
                  control={form.control}
                  name="countedCash"
                  render={({ field }) => (
                    <FormItem className="space-y-[10px]">
                      <FormLabel className="font-body text-sm font-semibold text-foreground">
                        {t("cashCount.label")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="counted"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder={t("cashCount.placeholder")}
                            className="h-12 rounded-xl border-[1.5px] border-foreground bg-card pl-10 pr-4 text-sm font-medium text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isValidCount && (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3",
                      difference === 0 &&
                        "border-success-border bg-success text-success-foreground",
                      difference > 0 && "border-info-border bg-info text-info-foreground",
                      difference < 0 &&
                        "border-warning-border bg-warning text-warning-foreground"
                    )}
                  >
                    {difference === 0 ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-semibold">
                          {t("reconciliation.perfect")}
                        </span>
                      </>
                    ) : difference > 0 ? (
                      <>
                        <Info className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-semibold">
                          {t("reconciliation.surplus", {
                            amount: formatCurrency(difference, locale),
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-semibold">
                          {t("reconciliation.shortage", {
                            amount: formatCurrency(Math.abs(difference), locale),
                          })}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!isValidCount || !session || isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Spinner />
                      {tCommon("closing")}
                    </>
                  ) : (
                    t("closeButton")
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>

        {session && (
          <Collapsible open={showDetail} onOpenChange={setShowDetail}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>{t("salesDetail", { count: openSessionSales.length })}</span>
                {showDetail ? (
                  <ChevronUp
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className={surfaceCardClass}>
                <div className="divide-y md:hidden">
                  {openSessionSales.length === 0 ? (
                    <div className="flex min-h-[120px] items-center justify-center px-6 py-8">
                      <SalesEmptyState />
                    </div>
                  ) : (
                    openSessionSales.map((sale) => (
                      <div key={sale.id} className="px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">
                            {formatTime(sale.createdAt, locale)}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(Number(sale.total), locale)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {sale.items
                            .map((i) =>
                              tCommon("saleItemFormat", {
                                name: i.productName,
                                quantity: i.quantity,
                              })
                            )
                            .join(", ")}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="h-10 border-b border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className={cn(tableHeadClass, "w-[120px] px-4")}>
                          {t("table.time")}
                        </TableHead>
                        <TableHead className={cn(tableHeadClass, "px-4")}>
                          {t("table.products")}
                        </TableHead>
                        <TableHead
                          className={cn(tableHeadClass, "w-[100px] px-4 text-right")}
                        >
                          {t("table.total")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openSessionSales.length === 0 ? (
                        <TableRow className="h-12 hover:bg-card">
                          <TableCell colSpan={3} className="px-4 py-8 text-center">
                            <SalesEmptyState />
                          </TableCell>
                        </TableRow>
                      ) : (
                        openSessionSales.map((sale) => (
                          <TableRow
                            key={sale.id}
                            className="h-12 border-b border-border/60 hover:bg-card"
                          >
                            <TableCell className="w-[120px] px-4 py-3 text-sm font-medium text-foreground">
                              {formatTime(sale.createdAt, locale)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                              {sale.items
                                .map((i) =>
                                  tCommon("saleItemFormat", {
                                    name: i.productName,
                                    quantity: i.quantity,
                                  })
                                )
                                .join(", ")}
                            </TableCell>
                            <TableCell className="w-[100px] px-4 py-3 text-right text-sm font-bold text-foreground">
                              {formatCurrency(Number(sale.total), locale)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmClose.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmClose.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              {t("confirmClose.yes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
