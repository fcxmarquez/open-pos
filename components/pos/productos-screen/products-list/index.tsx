import { format } from "date-fns";
import { es as esMX } from "date-fns/locale";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Nunca";
  return format(new Date(dateStr), "dd MMM yyyy", { locale: esMX });
}

interface ProductsListProps {
  isMobile: boolean;
  isPending: boolean;
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  products: Product[];
}

export function ProductsList({
  isMobile,
  isPending,
  onDelete,
  onEdit,
  products,
}: ProductsListProps) {
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {product.name === "Sin nombre" ? (
                    <p className="text-sm text-amber-600">
                      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                      Sin nombre - requiere registro
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                  )}
                  <div className="mt-0.5 flex flex-col gap-0.5 font-mono text-xs text-muted-foreground">
                    {product.barcode ? (
                      <p>{product.barcode}</p>
                    ) : (
                      <p className="text-muted-foreground/70">Sin codigo</p>
                    )}
                    <p>PLU: {product.pluCode ?? "—"}</p>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Venta: {formatDate(product.lastSoldAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(product)}
                      disabled={isPending}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(product)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">Precio de venta</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Última venta</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-sm">
                <div className="flex flex-col gap-0.5">
                  {product.barcode ? (
                    <span>{product.barcode}</span>
                  ) : (
                    <span className="text-muted-foreground">Sin codigo</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    PLU: {product.pluCode ?? "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {product.name === "Sin nombre" ? (
                  <span className="text-amber-600">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    Sin nombre - requiere registro
                  </span>
                ) : (
                  <span className="font-medium text-foreground">{product.name}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold text-foreground">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(product.lastSoldAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(product)}
                    disabled={isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(product)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
