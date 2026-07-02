"use client";

import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartItem } from "@/lib/store";

function parseCartQuantityInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, "");
  return Number.parseInt(digitsOnly, 10) || 0;
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onUpdatePrice: (price: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
}: CartItemRowProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");

  const commitPrice = () => {
    const parsed = Number.parseFloat(draftPrice);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onUpdatePrice(parsed);
    }
    setIsEditingPrice(false);
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-foreground">
          {item.product.name}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Precio</span>
          {isEditingPrice ? (
            <Input
              type="number"
              inputMode="decimal"
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPrice();
                if (e.key === "Escape") setIsEditingPrice(false);
              }}
              onFocus={(e) => e.target.select()}
              className="h-7 w-24 text-sm"
              min="0"
              step="1"
              autoFocus
              aria-label={`Precio de ${item.product.name}`}
            />
          ) : (
            <>
              <span className="text-xs text-foreground">
                ${item.unitPrice.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  setDraftPrice(String(item.unitPrice));
                  setIsEditingPrice(true);
                }}
                aria-label={`Editar precio de ${item.product.name}`}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-transparent"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            aria-label={`Disminuir cantidad de ${item.product.name}`}
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(item.quantity)}
            onChange={(e) => onUpdateQuantity(parseCartQuantityInput(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="h-7 w-14 text-center text-sm tabular-nums"
            aria-label={`Cantidad de ${item.product.name}`}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-transparent"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            aria-label={`Aumentar cantidad de ${item.product.name}`}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold text-foreground">
          {`$${(item.unitPrice * item.quantity).toFixed(2)}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          aria-label={`Eliminar ${item.product.name} del carrito`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
