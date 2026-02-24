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
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Mostrando {totalProducts === 0 ? 0 : (page - 1) * pageSize + 1}
          {" - "}
          {totalProducts === 0 ? 0 : Math.min(page * pageSize, totalProducts)}
          {" de "}
          {totalProducts}
        </span>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPreviousPage || isFetching}
        >
          Anterior
        </Button>
        <span className="min-w-28 text-center text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNextPage || isFetching}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
