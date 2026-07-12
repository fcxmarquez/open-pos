"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ProductsPaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hideMobilePaginationRow?: boolean;
  isFetching: boolean;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalProducts: number;
}

export function ProductsPagination({
  hasNextPage,
  hasPreviousPage,
  hideMobilePaginationRow = false,
  isFetching,
  onNext,
  onPrevious,
  page,
  pageSize,
  totalPages,
  totalProducts,
}: ProductsPaginationProps) {
  const t = useTranslations("common");
  const safePage = totalProducts === 0 ? 1 : Math.min(page, Math.max(totalPages, 1));
  const from = totalProducts === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = totalProducts === 0 ? 0 : Math.min(safePage * pageSize, totalProducts);

  return (
    <div className="mt-3 flex flex-col gap-0">
      {/* Badge bar */}
      <div className="flex items-center gap-3">
        <Badge
          variant="muted"
          size="chip"
          className="rounded-full px-3 py-1 font-semibold"
        >
          {t("productsCount", { count: totalProducts })}
        </Badge>
        <Badge
          variant="outline"
          size="chip"
          className="rounded-full px-3 py-1 font-normal"
        >
          {t("pageOf", { page, totalPages })}
        </Badge>
        {isFetching && <Spinner />}
      </div>

      {/* Pagination row */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity,transform,padding] duration-200 ease-out md:overflow-visible md:transition-none",
          hideMobilePaginationRow
            ? "pointer-events-none max-h-0 translate-y-[-8px] px-3 pt-0 opacity-0"
            : "max-h-24 translate-y-0 px-3 pt-3 opacity-100 md:max-h-none md:py-4"
        )}
        aria-hidden={hideMobilePaginationRow}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("showingResults", { from, to, total: totalProducts })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={hideMobilePaginationRow || !hasPreviousPage || isFetching}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={hideMobilePaginationRow || !hasNextPage || isFetching}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
