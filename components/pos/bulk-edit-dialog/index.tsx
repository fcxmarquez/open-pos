"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import { getCategoryMessageKey } from "@/lib/i18n/categories";
import { CATEGORY_OPTIONS } from "@/lib/pos-form-schemas";
import type { Category } from "@/lib/store";

const KEEP_CURRENT_CATEGORY = "__keep_current__";

type DialogStep = "edit" | "confirm";

export interface BulkProductUpdatesPayload {
  price?: number;
  costPrice?: number | null;
  category?: Category;
}

function createBulkEditFormSchema(tValidation: (key: string) => string) {
  return z.object({
    price: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) > 0),
        tValidation("bulkSalePriceInvalid")
      ),
    costPrice: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0),
        // biome-ignore lint/security/noSecrets: translation message key, not a secret
        tValidation("bulkCostPriceInvalid")
      ),
    category: z.union([z.enum(CATEGORY_OPTIONS), z.literal(KEEP_CURRENT_CATEGORY)]),
  });
}

type BulkEditFormValues = z.output<ReturnType<typeof createBulkEditFormSchema>>;

const bulkEditFormDefaults: BulkEditFormValues = {
  price: "",
  costPrice: "",
  category: KEEP_CURRENT_CATEGORY,
};

interface PreparedBulkUpdate {
  updates: BulkProductUpdatesPayload;
  fieldKeys: Array<"fieldSalePrice" | "fieldCostPrice" | "fieldCategory">;
}

function prepareBulkUpdate(values: BulkEditFormValues): PreparedBulkUpdate {
  const updates: BulkProductUpdatesPayload = {};
  const fieldKeys: PreparedBulkUpdate["fieldKeys"] = [];

  if (values.price !== "") {
    updates.price = Number.parseFloat(values.price);
    fieldKeys.push("fieldSalePrice");
  }

  if (values.costPrice !== "") {
    updates.costPrice = Number.parseFloat(values.costPrice);
    fieldKeys.push("fieldCostPrice");
  }

  if (values.category !== KEEP_CURRENT_CATEGORY) {
    updates.category = values.category;
    fieldKeys.push("fieldCategory");
  }

  return { updates, fieldKeys };
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
  const t = useTranslations("productos.bulk");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<DialogStep>("edit");
  const [pendingUpdates, setPendingUpdates] = useState<BulkProductUpdatesPayload | null>(
    null
  );
  const [pendingFieldKeys, setPendingFieldKeys] = useState<
    PreparedBulkUpdate["fieldKeys"]
  >([]);
  const bulkEditFormSchema = useMemo(
    () => createBulkEditFormSchema(tValidation),
    [tValidation]
  );
  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditFormSchema),
    defaultValues: bulkEditFormDefaults,
  });
  const watchedValues = form.watch();
  const affectedFieldKeys = prepareBulkUpdate(watchedValues).fieldKeys;
  const affectedFields = affectedFieldKeys.map((key) => t(key));
  const pendingFieldLabels = pendingFieldKeys.map((key) => t(key));

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(bulkEditFormDefaults);
    setStep("edit");
    setPendingUpdates(null);
    setPendingFieldKeys([]);
  }, [form, open]);

  const handlePrepareConfirm = (values: BulkEditFormValues) => {
    const prepared = prepareBulkUpdate(values);

    if (prepared.fieldKeys.length === 0) {
      form.setError("root", {
        type: "manual",
        // biome-ignore lint/security/noSecrets: translation message key, not a secret
        message: tValidation("bulkAtLeastOneField"),
      });
      return;
    }

    setPendingUpdates(prepared.updates);
    setPendingFieldKeys(prepared.fieldKeys);
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
            {step === "edit" ? t("editTitle") : t("confirmTitle")}
          </DialogTitle>
          <DialogDescription>
            {step === "edit"
              ? t("editDescription", { count: selectedCount })
              : t("confirmDescription", { count: selectedCount })}
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
                    <FormLabel className="text-foreground">
                      {t("salePriceLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder={tCategories("keepCurrent")}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("salePriceHint")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      {t("costPriceLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder={tCategories("keepCurrent")}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t("costPriceHint")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      {t("categoryLabel")}
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={tCategories("keepCurrent")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={KEEP_CURRENT_CATEGORY}>
                          {tCategories("keepCurrent")}
                        </SelectItem>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {tCategories(getCategoryMessageKey(category))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t("categoryHint")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border border-dashed px-3 py-2 text-sm">
                {affectedFields.length > 0 ? (
                  <p className="text-muted-foreground">
                    {t("willUpdate", { fields: affectedFields.join(", ") })}
                  </p>
                ) : (
                  <p className="text-muted-foreground">{t("completeOneField")}</p>
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
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {t("applyChanges")}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="mt-2 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t("confirmWarning", {
                count: selectedCount,
                fields: pendingFieldLabels.join(", "),
              })}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("edit")}
                disabled={isPending}
              >
                {tCommon("back")}
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
                    {tCommon("updating")}
                  </>
                ) : (
                  tCommon("confirm")
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
