import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import { checkpointer } from "./checkpointer";
import { stripReasoningFromHistory } from "./middleware/strip-reasoning-from-history";
import { makeModel } from "./model";
import { buildSystemPrompt } from "./prompts";
import { tools } from "./tools/index";

// The model has no inherent knowledge of the current date, so inject the current
// Mexico-TZ date into the system prompt on every invocation.
const dateAwareSystemPrompt = dynamicSystemPromptMiddleware(() => buildSystemPrompt());

export const graph = createAgent({
  model: makeModel(),
  tools,
  checkpointer,
  middleware: [dateAwareSystemPrompt, stripReasoningFromHistory],
});
