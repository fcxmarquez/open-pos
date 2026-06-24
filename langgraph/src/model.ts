import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { BaseMessage } from "@langchain/core/messages";
import type { ChatGenerationChunk } from "@langchain/core/outputs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * `ChatGoogleGenerativeAI` already emits Google reasoning as standard
 * `{ type: "thinking", thinking, signature }` content blocks — the exact shape
 * `@ag-ui/langgraph`'s `resolveReasoningContent` recognizes. So unlike the old
 * `ChatGoogle` wrapper, no format conversion or chunk splitting is needed.
 *
 * The one thing it does NOT do: surface those reasoning chunks on the
 * `on_chat_model_stream` event stream that AG-UI/CopilotKit consumes. Its
 * streaming loop calls `runManager.handleLLMNewToken(chunk.text ?? "")`
 * (`@langchain/google-genai/dist/chat_models.js`), and a reasoning chunk's
 * `.text` is `""` with no `{ chunk }` attached — so the event arrives with empty
 * content and the live "thinking" card never renders.
 *
 * Fix: suppress that text-only callback and re-fire `handleLLMNewToken` once per
 * chunk WITH the chunk attached, so both reasoning and answer chunks reach the
 * event stream intact. The accumulated/checkpointed message is unaffected (it is
 * built from the yielded chunks, not from the callback).
 */
class StreamingChatGoogleGenerativeAI extends ChatGoogleGenerativeAI {
  override async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): AsyncGenerator<ChatGenerationChunk> {
    const mutedRunManager = runManager
      ? (Object.create(runManager, {
          handleLLMNewToken: { value: async () => {} },
        }) as CallbackManagerForLLMRun)
      : undefined;

    for await (const chunk of super._streamResponseChunks(
      messages,
      options,
      mutedRunManager
    )) {
      yield chunk;
      const text =
        typeof chunk.message.content === "string"
          ? chunk.message.content
          : (chunk.text ?? "");
      await runManager?.handleLLMNewToken(
        text,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          chunk,
        }
      );
    }
  }
}

export function makeModel() {
  return new StreamingChatGoogleGenerativeAI({
    model: "gemma-4-31b-it",
    apiKey: process.env.GOOGLE_API_KEY,
    thinkingConfig: { includeThoughts: true },
  });
}
