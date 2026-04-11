"use client";

import { Receipt } from "lucide-react";
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
  return (
    <Card className="flex flex-col rounded-3xl">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Últimas transacciones</CardTitle>
          <p className="text-sm text-muted-foreground">
            Movimientos recientes del turno actual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" size="pill">
            {transactionCount} ventas
          </Badge>
          <Badge variant="muted" size="pill">
            {productsSold} productos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
        {latestTransactions.length === 0 ? (
          <PanelEmptyState
            icon={Receipt}
            title="No hay transacciones hoy"
            description="Las ventas realizadas durante el turno actual aparecerán aquí."
          />
        ) : (
          <div className="h-80 grow overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestTransactions.map((transaction) => {
                  const visibleItems = transaction.items.slice(0, 2);
                  const hiddenItems = transaction.items.length - visibleItems.length;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-foreground">
                        {formatTime(new Date(transaction.createdAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {visibleItems.map((item, index) => (
                            <Badge
                              key={`${transaction.id}-${item.name}-${index}`}
                              variant="muted"
                              size="chip"
                            >
                              {item.name} x{item.quantity}
                            </Badge>
                          ))}
                          {hiddenItems > 0 ? (
                            <Badge variant="muted" size="chip">
                              +{hiddenItems}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(transaction.total)}
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
