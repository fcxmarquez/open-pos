"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_OPTIONS } from "@/lib/pos-form-schemas";
import type { Category } from "@/lib/store";

const KEEP_CURRENT_CATEGORY = "__keep_current__";

type DialogStep = "edit" | "confirm";

export interface BulkProductUpdatesPayload {
  price?: number;
  costPrice?: number | null;
  category?: Category;
}

const bulkEditFormSchema = z.object({
  price: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) > 0),
      "Ingresa un precio de venta valido"
    ),
  costPrice: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0),
      "Ingresa un precio de costo valido"
    ),
  category: z.union([z.enum(CATEGORY_OPTIONS), z.literal(KEEP_CURRENT_CATEGORY)]),
});

const bulkEditFormDefaults: z.input<typeof bulkEditFormSchema> = {
  price: "",
  costPrice: "",
  category: KEEP_CURRENT_CATEGORY,
};

type BulkEditFormValues = z.output<typeof bulkEditFormSchema>;

interface PreparedBulkUpdate {
  updates: BulkProductUpdatesPayload;
  fieldLabels: string[];
}

function prepareBulkUpdate(values: BulkEditFormValues): PreparedBulkUpdate {
  const updates: BulkProductUpdatesPayload = {};
  const fieldLabels: string[] = [];

  if (values.price !== "") {
    updates.price = Number.parseFloat(values.price);
    fieldLabels.push("Precio de venta");
  }

  if (values.costPrice !== "") {
    updates.costPrice = Number.parseFloat(values.costPrice);
    fieldLabels.push("Precio de costo");
  }

  if (values.category !== KEEP_CURRENT_CATEGORY) {
    updates.category = values.category;
    fieldLabels.push("Categoria");
  }

  return { updates, fieldLabels };
}

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onApply: (updates: BulkProductUpdatesPayload) => Promise<boolean>;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  onApply,
}: BulkEditDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<DialogStep>("edit");
  const [pendingUpdates, setPendingUpdates] = useState<BulkProductUpdatesPayload | null>(
    null
  );
  const [pendingFieldLabels, setPendingFieldLabels] = useState<string[]>([]);
  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditFormSchema),
    defaultValues: bulkEditFormDefaults,
  });
  const watchedValues = form.watch();
  const affectedFields = prepareBulkUpdate(watchedValues).fieldLabels;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(bulkEditFormDefaults);
    setStep("edit");
    setPendingUpdates(null);
    setPendingFieldLabels([]);
  }, [form, open]);

  const handlePrepareConfirm = (values: BulkEditFormValues) => {
    const prepared = prepareBulkUpdate(values);

    if (prepared.fieldLabels.length === 0) {
      form.setError("root", {
        type: "manual",
        message: "Debes completar al menos un campo para continuar",
      });
      return;
    }

    setPendingUpdates(prepared.updates);
    setPendingFieldLabels(prepared.fieldLabels);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!pendingUpdates) {
      return;
    }

    startTransition(async () => {
      const success = await onApply(pendingUpdates);
      if (success) {
        onOpenChange(false);
      }
    });
  };

  const selectedLabel = `${selectedCount} producto${selectedCount === 1 ? "" : "s"}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) {
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {step === "edit" ? "Editar productos seleccionados" : "Confirmar cambios"}
          </DialogTitle>
          <DialogDescription>
            {step === "edit"
              ? `Actualiza en lote ${selectedLabel}.`
              : `Vas a actualizar ${selectedLabel}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "edit" ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handlePrepareConfirm)}
              className="mt-2 flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Precio de venta</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="Sin cambios"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Dejalo vacio para mantener el precio actual de cada producto.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Precio de costo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="Sin cambios"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Dejalo vacio para mantener el costo actual de cada producto.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Categoria</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={KEEP_CURRENT_CATEGORY}>Sin cambios</SelectItem>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Elige "Sin cambios" para mantener la categoria actual de cada
                      producto.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border border-dashed px-3 py-2 text-sm">
                {affectedFields.length > 0 ? (
                  <p className="text-muted-foreground">
                    Se actualizara:{" "}
                    <span className="font-medium text-foreground">
                      {affectedFields.join(", ")}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Completa al menos un campo para aplicar cambios.
                  </p>
                )}
              </div>

              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  Aplicar cambios
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="mt-2 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Estas por actualizar {selectedLabel}.{" "}
              <span className="font-medium text-foreground">
                {pendingFieldLabels.join(", ")}
              </span>{" "}
              se cambiaran. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("edit")}
                disabled={isPending}
              >
                Volver
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Actualizando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
