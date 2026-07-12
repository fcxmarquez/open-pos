"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategoryMessageKey } from "@/lib/i18n/categories";
import { UNNAMED_PRODUCT_FALLBACK } from "@/lib/mappers";
import type { Category, Product } from "@/lib/store";
import { cn, formatCurrency, formatDateLabel } from "@/lib/utils";

interface ProductsListProps {
  allSelectedOnPage: boolean;
  isMobile: boolean;
  isPending: boolean;
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleProductSelection: (productId: string) => void;
  onToggleSelectAllPage: (checked: boolean) => void;
  products: Product[];
  selectedProductIds: Set<string>;
  someSelectedOnPage: boolean;
}

type SortColumn = "code" | "name" | "price" | "category" | "lastSoldAt";
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

function getCodeSortValue(product: Product): string {
  return product.barcode || product.pluCode || "";
}

function getLastSoldAtSortValue(product: Product): number {
  if (!product.lastSoldAt) {
    return Number.NEGATIVE_INFINITY;
  }

  return new Date(product.lastSoldAt).getTime();
}

function sortProducts(products: Product[], sortState: SortState | null): Product[] {
  if (!sortState) {
    return products;
  }

  return [...products].sort((leftProduct, rightProduct) => {
    let comparison = 0;

    switch (sortState.column) {
      case "code":
        comparison = getCodeSortValue(leftProduct).localeCompare(
          getCodeSortValue(rightProduct),
          "es",
          { numeric: true, sensitivity: "base" }
        );
        break;
      case "name":
        comparison = (leftProduct.name ?? "").localeCompare(
          rightProduct.name ?? "",
          "es",
          { sensitivity: "base" }
        );
        break;
      case "price":
        comparison = leftProduct.price - rightProduct.price;
        break;
      case "category":
        comparison = (leftProduct.category ?? "").localeCompare(
          rightProduct.category ?? "",
          "es",
          { sensitivity: "base" }
        );
        break;
      case "lastSoldAt":
        comparison =
          getLastSoldAtSortValue(leftProduct) - getLastSoldAtSortValue(rightProduct);
        break;
    }

    return sortState.direction === "asc" ? comparison : comparison * -1;
  });
}

const SORT_BTN_CLS =
  "h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground";
const CATEGORY_BADGE_CLASS = "border-transparent bg-muted";

export function ProductsList({
  allSelectedOnPage,
  isMobile,
  isPending,
  onDelete,
  onEdit,
  onToggleProductSelection,
  onToggleSelectAllPage,
  products,
  selectedProductIds,
  someSelectedOnPage,
}: ProductsListProps) {
  const t = useTranslations("productos.table");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const locale = useLocale();
  const [sortState, setSortState] = useState<SortState | null>({
    column: "lastSoldAt",
    direction: "desc",
  });
  const sortedProducts = useMemo(
    () => sortProducts(products, sortState),
    [products, sortState]
  );

  const getAriaSort = (column: SortColumn): "ascending" | "descending" | "none" => {
    if (!sortState || sortState.column !== column) return "none";
    return sortState.direction === "asc" ? "ascending" : "descending";
  };

  const toggleSort = (column: SortColumn) => {
    setSortState((currentState) => {
      if (!currentState || currentState.column !== column) {
        // lastSoldAt defaults to desc (most recently sold first); others start asc
        return { column, direction: column === "lastSoldAt" ? "desc" : "asc" };
      }

      if (currentState.direction === "asc") {
        return { column, direction: "desc" };
      }

      return null;
    });
  };

  const getSortIcon = (column: SortColumn) => {
    if (!sortState || sortState.column !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    if (sortState.direction === "asc") {
      return <ChevronUp className="h-4 w-4" />;
    }

    return <ChevronDown className="h-4 w-4" />;
  };

  const formatCategory = (category: Category) =>
    tCategories(getCategoryMessageKey(category));

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Checkbox
                  checked={selectedProductIds.has(product.id)}
                  onCheckedChange={() => onToggleProductSelection(product.id)}
                  disabled={isPending}
                  aria-label={t("selectAria", { name: product.name })}
                  className="mt-1"
                />
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {product.name === UNNAMED_PRODUCT_FALLBACK ? (
                      <p className="text-sm text-warning-foreground">
                        <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                        {tCommon("unnamedRequiresRegistration")}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                    )}
                    <div className="mt-0.5 flex flex-col gap-0.5 font-mono text-xs text-muted-foreground">
                      {product.barcode ? (
                        <p>{product.barcode}</p>
                      ) : (
                        <p className="text-muted-foreground/70">{tCommon("noCode")}</p>
                      )}
                      <p>
                        {product.pluCode
                          ? tCommon("pluLabel", { code: product.pluCode })
                          : tCommon("pluEmpty")}
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="muted" size="chip" className={CATEGORY_BADGE_CLASS}>
                        {formatCategory(product.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {tCommon("saleLabel", {
                          date: formatDateLabel(
                            product.lastSoldAt,
                            locale,
                            tCommon("never")
                          ),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-base font-bold text-foreground">
                      {formatCurrency(product.price, locale)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(product)}
                        disabled={isPending}
                        aria-label={t("editAria", { name: product.name })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">{tCommon("edit")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(product)}
                        disabled={isPending}
                        aria-label={t("deleteAria", { name: product.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{tCommon("delete")}</span>
                      </Button>
                    </div>
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="h-12 w-10 px-5">
              <Checkbox
                checked={
                  allSelectedOnPage ? true : someSelectedOnPage ? "indeterminate" : false
                }
                onCheckedChange={(checked) => onToggleSelectAllPage(checked === true)}
                disabled={isPending}
                aria-label={t("selectAllAria")}
              />
            </TableHead>
            <TableHead className="h-12 px-5" aria-sort={getAriaSort("code")}>
              <Button
                variant="ghost"
                size="sm"
                className={SORT_BTN_CLS}
                onClick={() => toggleSort("code")}
              >
                {t("code")}
                {getSortIcon("code")}
              </Button>
            </TableHead>
            <TableHead className="h-12 px-5" aria-sort={getAriaSort("name")}>
              <Button
                variant="ghost"
                size="sm"
                className={SORT_BTN_CLS}
                onClick={() => toggleSort("name")}
              >
                {t("name")}
                {getSortIcon("name")}
              </Button>
            </TableHead>
            <TableHead className="h-12 px-5 text-right" aria-sort={getAriaSort("price")}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(SORT_BTN_CLS, "w-full justify-end")}
                onClick={() => toggleSort("price")}
              >
                {t("salePrice")}
                {getSortIcon("price")}
              </Button>
            </TableHead>
            <TableHead className="h-12 px-5" aria-sort={getAriaSort("category")}>
              <Button
                variant="ghost"
                size="sm"
                className={SORT_BTN_CLS}
                onClick={() => toggleSort("category")}
              >
                {t("category")}
                {getSortIcon("category")}
              </Button>
            </TableHead>
            <TableHead className="h-12 px-5" aria-sort={getAriaSort("lastSoldAt")}>
              <Button
                variant="ghost"
                size="sm"
                className={SORT_BTN_CLS}
                onClick={() => toggleSort("lastSoldAt")}
              >
                {t("lastSale")}
                {getSortIcon("lastSoldAt")}
              </Button>
            </TableHead>
            <TableHead className="h-12 px-5 text-right text-xs font-semibold text-muted-foreground">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.map((product) => (
            <TableRow
              key={product.id}
              className={cn(
                "h-16 border-b border-border/60",
                selectedProductIds.has(product.id) && "bg-muted/60"
              )}
            >
              <TableCell className="px-5">
                <Checkbox
                  checked={selectedProductIds.has(product.id)}
                  onCheckedChange={() => onToggleProductSelection(product.id)}
                  disabled={isPending}
                  aria-label={t("selectAria", { name: product.name })}
                />
              </TableCell>
              <TableCell className="px-5 font-mono text-sm">
                <div className="flex flex-col gap-0.5">
                  {product.barcode ? (
                    <span>{product.barcode}</span>
                  ) : (
                    <span className="text-muted-foreground">{tCommon("noCode")}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {product.pluCode
                      ? tCommon("pluLabel", { code: product.pluCode })
                      : tCommon("pluEmpty")}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-5">
                {product.name === UNNAMED_PRODUCT_FALLBACK ? (
                  <span className="text-warning-foreground">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    {tCommon("unnamedRequiresRegistration")}
                  </span>
                ) : (
                  <span className="font-medium text-foreground">{product.name}</span>
                )}
              </TableCell>
              <TableCell className="px-5 text-right font-semibold text-foreground">
                {formatCurrency(product.price, locale)}
              </TableCell>
              <TableCell className="px-5">
                <Badge variant="muted" size="chip" className={CATEGORY_BADGE_CLASS}>
                  {formatCategory(product.category)}
                </Badge>
              </TableCell>
              <TableCell className="px-5 text-sm text-muted-foreground">
                {formatDateLabel(product.lastSoldAt, locale, tCommon("never"))}
              </TableCell>
              <TableCell className="px-5 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground"
                    onClick={() => onEdit(product)}
                    disabled={isPending}
                    aria-label={t("editAria", { name: product.name })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">{tCommon("edit")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(product)}
                    disabled={isPending}
                    aria-label={t("deleteAria", { name: product.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">{tCommon("delete")}</span>
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
