import type { getTranslations } from "next-intl/server";

export type ValidationTranslator = Awaited<
  ReturnType<typeof getTranslations<"validation">>
>;

export type ErrorsTranslator = Awaited<ReturnType<typeof getTranslations<"errors">>>;
