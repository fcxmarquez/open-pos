"use client";

import { Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatTime } from "@/lib/utils";
import { PanelEmptyState } from "../panel-empty-state";

type TransactionRecord = {
  id: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
  total: number;
};

interface LatestTransactionsPanelProps {
  transactionCount: number;
  productsSold: number;
  latestTransactions: TransactionRecord[];
}

export function LatestTransactionsPanel({
  transactionCount,
  productsSold,
  latestTransactions,
}: LatestTransactionsPanelProps) {
  const t = useTranslations();
  const tTx = useTranslations("admin.transactions");
  const locale = useLocale();

  return (
    <Card className="flex flex-col rounded-3xl">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{tTx("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{tTx("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" size="pill">
            {t("common.salesCount", { count: transactionCount })}
          </Badge>
          <Badge variant="muted" size="pill">
            {t("common.productsCount", { count: productsSold })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
        {latestTransactions.length === 0 ? (
          <PanelEmptyState
            icon={Receipt}
            title={tTx("emptyTitle")}
            description={tTx("emptyDescription")}
          />
        ) : (
          <div className="h-80 grow overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tTx("table.time")}</TableHead>
                  <TableHead>{tTx("table.products")}</TableHead>
                  <TableHead className="text-right">{tTx("table.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestTransactions.map((transaction) => {
                  const visibleItems = transaction.items.slice(0, 2);
                  const hiddenItems = transaction.items.length - visibleItems.length;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-foreground">
                        {formatTime(new Date(transaction.createdAt), locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {visibleItems.map((item, index) => (
                            <Badge
                              key={`${transaction.id}-${item.name}-${index}`}
                              variant="muted"
                              size="chip"
                            >
                              {t("common.saleItemFormat", {
                                name: item.name,
                                quantity: item.quantity,
                              })}
                            </Badge>
                          ))}
                          {hiddenItems > 0 ? (
                            <Badge variant="muted" size="chip">
                              {t("common.moreItems", { count: hiddenItems })}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(transaction.total, locale)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
