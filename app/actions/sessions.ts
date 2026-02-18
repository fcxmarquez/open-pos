"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { salesSessions } from "@/db/schema";
import type { ActionResult } from "@/lib/types";
import { formatZodError } from "@/lib/types";

const closeSessionSchema = z.object({
  sessionId: z.string().uuid("ID de sesión inválido"),
  countedTotal: z.coerce
    .number()
    .nonnegative("El total contado debe ser mayor o igual a 0"),
});

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
  input: z.input<typeof closeSessionSchema>
): Promise<ActionResult<CloseSessionResult>> {
  const parsed = closeSessionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error),
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
        return { success: false, data: null, error: "Sesión no encontrada" } as const;
      }

      if (session.status !== "open") {
        return { success: false, data: null, error: "La sesión ya fue cerrada" } as const;
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
          closedAt,
        })
        .where(eq(salesSessions.id, sessionId))
        .returning();

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
      error: "No se pudo cerrar la sesión",
    };
  }
}
