"use client";

import { CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function parseDiscountPercentInput(rawValue: string) {
  const sanitized = rawValue.replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function DiscountControl() {
  const cartIsEmpty = useStore((s) => s.cart.length === 0);
  const discountPercent = useStore((s) => s.discountPercent);
  const setDiscountPercent = useStore((s) => s.setDiscountPercent);
  const [isOpen, setIsOpen] = useState(false);
  const [draftPercent, setDraftPercent] = useState("");

  const hasDiscount = discountPercent > 0;

  const openEditor = () => {
    setDraftPercent(discountPercent === 0 ? "" : String(discountPercent));
    setIsOpen(true);
  };

  const applyDraft = () => {
    setDiscountPercent(parseDiscountPercentInput(draftPercent));
    setIsOpen(false);
  };

  return (
    // cart-percentage-discount.DISCOUNT_INPUT.1, cart-percentage-discount.DISCOUNT_INPUT.1-1, cart-percentage-discount.DISCOUNT_INPUT.2
    <div className="flex items-center gap-1.5 border-b px-5 py-3">
      <Popover
        open={isOpen}
        onOpenChange={(open) => (open ? openEditor() : setIsOpen(false))}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            // cart-percentage-discount.DISCOUNT_INPUT.3
            disabled={cartIsEmpty}
            className={cn(
              "gap-1.5 rounded-full",
              hasDiscount
                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                : "text-primary"
            )}
          >
            {hasDiscount ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {`${discountPercent}% aplicado`}
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Descuento
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Descuento sobre el subtotal
          </p>
          <div className="flex items-center gap-1.5">
            <Input
              type="text"
              inputMode="decimal"
              value={draftPercent}
              onChange={(e) => setDraftPercent(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyDraft();
                if (e.key === "Escape") setIsOpen(false);
              }}
              placeholder="0"
              autoFocus
              className="h-9 text-right text-sm font-semibold"
              aria-label="Porcentaje de descuento"
            />
            <span className="text-sm font-semibold text-foreground">%</span>
          </div>
          <Button size="sm" className="mt-2.5 w-full" onClick={applyDraft}>
            Aplicar
          </Button>
        </PopoverContent>
      </Popover>

      {hasDiscount && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={openEditor}
            disabled={cartIsEmpty}
            aria-label="Editar descuento"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDiscountPercent(0)}
            aria-label="Quitar descuento"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </>
      )}
    </div>
  );
}
