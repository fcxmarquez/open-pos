import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductsPaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
        <span className="rounded-[20px] bg-[#F4F4F5] px-3 py-1 text-xs font-semibold text-[#09090B]">
          {totalProducts} productos
        </span>
        <span className="rounded-[20px] border border-[#E4E4E7] px-3 py-1 text-xs text-[#71717A]">
          Página {page} de {totalPages}
        </span>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Pagination row */}
      <div className="flex items-center justify-between py-4">
        <span className="text-[13px] text-[#71717A]">
          Mostrando {from} a {to} de {totalProducts} resultados
        </span>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-lg border border-[#E4E4E7] bg-background px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted"
            onClick={onPrevious}
            disabled={!hasPreviousPage || isFetching}
          >
            Anterior
          </Button>
          <Button
            className="rounded-lg border border-[#E4E4E7] bg-background px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted"
            onClick={onNext}
            disabled={!hasNextPage || isFetching}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
