"use client";

import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Category, type Product, useStore } from "@/lib/store";
import { ProductFormDialog } from "./product-form-dialog";

const CATEGORIES: Category[] = [
  "General",
  "Papelería",
  "Útiles escolares",
  "Arte",
  "Oficina",
  "Otro",
];

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Nunca";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductosScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const products = useStore((s) => s.products);
  const deleteProduct = useStore((s) => s.deleteProduct);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const unnamed = products.filter(
    (p) => !p.name || p.name.startsWith("Producto sin nombre")
  ).length;

  const handleDelete = (product: Product) => {
    if (window.confirm(`Eliminar "${product.name}"? Esta accion no se puede deshacer.`)) {
      deleteProduct(product.id);
      toast.success("Producto eliminado");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-5">
      {/* Header with stats and actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {products.length} productos
          </Badge>
          {unnamed > 0 && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              {unnamed} sin nombre
            </Badge>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar producto
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o codigo..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorias</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products - Table on desktop, Cards on mobile */}
      <ScrollArea className="flex-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            No se encontraron productos
          </div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {product.name.startsWith("Producto sin nombre") ? (
                          <p className="text-sm text-amber-600">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            Sin nombre - requiere registro
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-foreground">
                            {product.name}
                          </p>
                        )}
                        {product.barcode && (
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {product.barcode}
                          </p>
                        )}
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
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(product)}
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

            {/* Desktop: Table layout */}
            <div className="hidden rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Precio de venta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ultima venta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">
                        {product.barcode || (
                          <span className="text-muted-foreground">Sin codigo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.name.startsWith("Producto sin nombre") ? (
                          <span className="text-amber-600">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            Sin nombre - requiere registro
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {product.name}
                          </span>
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
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(product)}
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
          </>
        )}
      </ScrollArea>

      {/* Product form dialog */}
      <ProductFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        product={editingProduct}
      />
    </div>
  );
}
