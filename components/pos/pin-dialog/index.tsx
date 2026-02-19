"use client";

import { Lock, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CORRECT_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234";
const PIN_LENGTH = 4;

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PinDialog({ open, onOpenChange, onSuccess }: PinDialogProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resetState = useCallback(() => {
    setDigits(["", "", "", ""]);
    setError(false);
    setShake(false);
  }, []);

  useEffect(() => {
    if (open) {
      resetState();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open, resetState]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(false);

    if (digit && index < PIN_LENGTH - 1) {
      // Move to next input
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are filled
    if (digit && index === PIN_LENGTH - 1) {
      const pin = newDigits.join("");
      if (pin === CORRECT_PIN) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (text.length === PIN_LENGTH) {
      const newDigits = text.split("");
      setDigits(newDigits);
      const pin = newDigits.join("");
      if (pin === CORRECT_PIN) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-foreground">Acceso restringido</DialogTitle>
          <DialogDescription>
            Ingresa el PIN de administrador para continuar
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex items-center justify-center gap-3 py-4",
            shake && "animate-shake"
          )}
        >
          {digits.map((digit, index) => (
            <Input
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length PIN input, never reordered
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={cn(
                "h-14 w-14 text-center text-2xl font-bold",
                error && "border-destructive focus-visible:ring-destructive"
              )}
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-destructive">
            <ShieldAlert className="h-4 w-4" />
            <span>PIN incorrecto. Intenta de nuevo.</span>
          </div>
        )}

        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
