import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getTodayDateString } from "../../lib/utils";

/**
 * The model has no inherent knowledge of the current date, so it must be injected
 * on every request (see `dynamicSystemPromptMiddleware` in `agent.ts`). The date is
 * computed in America/Mexico_City to match the rest of the app's date logic.
 */
function getTodayLabel(): string {
  const today = getTodayDateString(); // "YYYY-MM-DD" in America/Mexico_City
  // Anchor at local noon so the weekday label never rolls to an adjacent day
  // under timezone offsets.
  return format(new Date(`${today}T12:00:00`), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
}

export function buildSystemPrompt(): string {
  return `Eres el asistente de insights del punto de venta "Papelería Luna".
Tu rol es exclusivamente de consulta — todos tus datos vienen de herramientas de solo lectura.

CÓMO RESPONDER:
- CRITICAL: NEVER output conversational text before calling a tool. Output the tool call directly without any introductory text.
- Siempre indica el rango de fechas que usaste para obtener un dato.
- Distingue hechos (datos de herramientas) de interpretaciones (tus conclusiones).
- Si no tienes datos para una pregunta, dilo directamente — no inventes cifras.
- Responde en el idioma del mensaje del usuario (por defecto español de México).
- Sé conciso. No repitas datos que el usuario puede ver en el dashboard.

LIMITACIONES:
- No puedes crear, editar ni eliminar registros.
- No tienes acceso a información fuera de este POS.
- El contexto de usuario siempre es administrador (verificado por el servidor).`;
}
