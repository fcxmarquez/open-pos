"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

export type HistoryRecord = {
  id: string;
  sessionDate: string;
  sessionNumber: number;
  salesCount: number;
  revenue: number;
  difference: number;
};

export function formatHistoryLabel(dateString: string, sessionNumber: number): string {
  const label = format(new Date(`${dateString}T12:00:00`), "d MMM", {
    locale: es,
  });
  return `${label} · T${sessionNumber}`;
}

function getDifferenceColor(difference: number): string {
  if (difference > 0) return "text-success-foreground";
  if (difference < 0) return "text-error-foreground";
  return "text-muted-foreground";
}

export function HistoryTable({ records }: { records: HistoryRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Ventas</TableHead>
          <TableHead>Ingresos</TableHead>
          <TableHead className="text-right">Diferencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium text-foreground">
              {formatHistoryLabel(record.sessionDate, record.sessionNumber)}
            </TableCell>
            <TableCell>{record.salesCount}</TableCell>
            <TableCell>{formatCurrency(record.revenue)}</TableCell>
            <TableCell
              className={cn(
                "text-right font-semibold",
                getDifferenceColor(record.difference)
              )}
            >
              {record.difference > 0 ? "+" : ""}
              {formatCurrency(record.difference)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
