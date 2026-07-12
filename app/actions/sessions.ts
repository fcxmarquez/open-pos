"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/db";
import { salesSessions } from "@/db/schema";
import { type ActionResult, formatZodError } from "@/lib/types";

type ValidationT = Awaited<ReturnType<typeof getTranslations<"validation">>>;

function createCloseSessionSchema(t: ValidationT) {
  return z.object({
    sessionId: z.string().uuid(t("sessionIdInvalid")),
    countedTotal: z.coerce.number().nonnegative(t("countedTotalNonNegative")),
  });
}

interface CloseSessionResult {
  id: string;
  sessionDate: string;
  systemTotal: string;
  countedTotal: string;
  difference: string;
  status: string;
  closedAt: Date;
}

export async function closeSession(
  input: z.input<ReturnType<typeof createCloseSessionSchema>>
): Promise<ActionResult<CloseSessionResult>> {
  const t = await getTranslations("validation");
  const tErrors = await getTranslations("errors");
  const closeSessionSchema = createCloseSessionSchema(t);
  const parsed = closeSessionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error, t("invalidInput")),
    };
  }

  const { sessionId, countedTotal } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(salesSessions)
        .where(eq(salesSessions.id, sessionId))
        .limit(1);

      if (!session) {
        return {
          success: false,
          data: null,
          error: tErrors("sessionNotFound"),
        } as const;
      }

      if (session.status !== "open") {
        return {
          success: false,
          data: null,
          error: tErrors("sessionAlreadyClosed"),
        } as const;
      }

      const systemTotal = Number(session.systemTotal ?? 0);
      const difference = countedTotal - systemTotal;
      const closedAt = new Date();

      const [updated] = await tx
        .update(salesSessions)
        .set({
          countedTotal: countedTotal.toFixed(2),
          difference: difference.toFixed(2),
          status: "closed",
          closedReason: "manual",
          closedAt,
        })
        .where(and(eq(salesSessions.id, sessionId), eq(salesSessions.status, "open")))
        .returning();

      if (!updated) {
        return {
          success: false,
          data: null,
          error: tErrors("sessionAlreadyClosed"),
        } as const;
      }

      return {
        success: true,
        data: {
          id: updated.id,
          sessionDate: updated.sessionDate,
          systemTotal: updated.systemTotal ?? "0.00",
          countedTotal: updated.countedTotal ?? countedTotal.toFixed(2),
          difference: updated.difference ?? difference.toFixed(2),
          status: updated.status ?? "closed",
          closedAt,
        },
        error: null,
      } as const;
    });

    if (result.success) {
      revalidatePath("/");
    }

    return result;
  } catch (err) {
    console.error("closeSession failed:", err);
    return {
      success: false,
      data: null,
      error: tErrors("closeSessionFailed"),
    };
  }
}
