/**
 * Logs the underlying error server-side and returns a generic, caller-safe
 * failure payload. Keeps internal DB/query details out of the model (and
 * therefore the chat) context.
 */
export function toolError(toolName: string, err: unknown) {
  console.error(`[${toolName}] failed:`, err);
  return { ok: false as const, error: "Internal error while fetching data." };
}
