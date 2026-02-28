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
  const from = totalProducts === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalProducts === 0 ? 0 : Math.min(page * pageSize, totalProducts);

  return (
    <div className="mt-3 flex flex-col gap-0">
      {/* Badge bar */}
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          {totalProducts} productos
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Página {page} de {totalPages}
        </span>
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
            Mostrando {from} a {to} de {totalProducts} resultados
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={hideMobilePaginationRow || !hasPreviousPage || isFetching}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={hideMobilePaginationRow || !hasNextPage || isFetching}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
