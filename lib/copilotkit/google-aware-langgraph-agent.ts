import {
  EventType,
  type ReasoningEndEvent,
  type ReasoningMessageEndEvent,
} from "@ag-ui/client";
import type { ProcessedEvents } from "@ag-ui/langgraph";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

/**
 * Message roles emitted by AG-UI reasoning/activity events that
 * `@ag-ui/langgraph`'s message converter does not understand. They must be
 * filtered before the conversion function runs, otherwise replaying them on a
 * later turn throws "message role is not supported."
 *
 * Verified 2026-06-23 against the installed `@copilotkit/runtime@1.56.0`
 * (`dist/lib/runtime/agent-integrations/langgraph/agent.mjs`): its base
 * `LangGraphAgent.run()` does NOT pre-filter any of these roles — that filter
 * exists only on CopilotKit's `main` branch. So this override is the sole place
 * they are stripped; do not narrow it.
 */
const UNSUPPORTED_AG_UI_ROLES = new Set(["reasoning", "activity", "developer"]);

/** Drops messages whose role the LangGraph converter would reject. */
export function filterUnsupportedAgUiRoles<T extends { role?: unknown }>(
  messages: T[]
): T[] {
  return messages.filter(
    (message) => !UNSUPPORTED_AG_UI_ROLES.has(message.role as string)
  );
}

type StoredContentBlock = string | { type?: string; text?: string };

const isTextBlock = (block: StoredContentBlock): boolean =>
  typeof block === "string" || block.type === "text";

/**
 * Google models stream text after a thinking block as several separate
 * `{type:"text"}` blocks, but `@ag-ui/langgraph`'s state parser only reads the
 * FIRST text block. Concatenate them — preserving any non-text blocks (e.g. tool
 * calls) ahead of the merged text — so the snapshot keeps the whole message.
 * Non-array or text-less content is returned unchanged.
 */
export function normalizeStoredContent(content: unknown): unknown {
  if (!Array.isArray(content)) {
    return content;
  }
  const blocks = content as StoredContentBlock[];
  const textBlocks = blocks.filter(isTextBlock);
  if (textBlocks.length === 0) {
    return content;
  }
  const fullText = textBlocks
    .map((block) => (typeof block === "string" ? block : (block.text ?? "")))
    .join("");
  const nonTextBlocks = blocks.filter((block) => !isTextBlock(block));
  return nonTextBlocks.length > 0
    ? [...nonTextBlocks, { type: "text", text: fullText }]
    : fullText;
}

type UnifiedReasoning = {
  messageId: string;
  hasMessage: boolean;
};

export class GoogleAwareLangGraphAgent extends LangGraphAgent {
  /**
   * AG-UI creates a reasoning message for each model invocation. A ReAct-style
   * agent invocation includes several model calls whenever it plans a tool,
   * receives its result, and plans the next action. Keep those phases in one
   * UI-facing message so a single user prompt has one reasoning section.
   */
  private unifiedReasoning: UnifiedReasoning | null = null;

  constructor(options: ConstructorParameters<typeof LangGraphAgent>[0]) {
    super(options);

    // Intercept getState to fix @ag-ui/langgraph's parsing bug: Google models
    // store post-thinking text as several {type:"text"} blocks, but the parser
    // reads only the first. normalizeStoredContent concatenates them.
    const originalGetState = this.client.threads.getState.bind(this.client.threads);
    // The SDK's getState is generic over ValuesType; this override is concrete
    // (it only cleans message content, preserving the state shape), so cast the
    // assignment back to the original generic signature.
    this.client.threads.getState = (async (threadId: string) => {
      const state = await originalGetState(threadId);
      const messages = (state.values as { messages?: unknown })?.messages;
      if (Array.isArray(messages)) {
        for (const msg of messages as Array<{ content?: unknown }>) {
          msg.content = normalizeStoredContent(msg.content);
        }
      }
      return state;
    }) as typeof this.client.threads.getState;
  }

  override clone(): GoogleAwareLangGraphAgent {
    const cloned = super.clone() as GoogleAwareLangGraphAgent;
    // Runs use per-thread agent clones. Never let a completed or concurrent run
    // carry a reasoning message ID into a new clone.
    cloned.unifiedReasoning = null;
    return cloned;
  }

  override dispatchEvent(event: ProcessedEvents): boolean {
    switch (event.type) {
      case EventType.RUN_STARTED:
        this.unifiedReasoning = null;
        return super.dispatchEvent(event);

      case EventType.REASONING_START:
        if (this.unifiedReasoning) {
          return true;
        }
        this.unifiedReasoning = { messageId: event.messageId, hasMessage: false };
        return super.dispatchEvent(event);

      case EventType.REASONING_MESSAGE_START:
        if (!this.unifiedReasoning) {
          this.unifiedReasoning = { messageId: event.messageId, hasMessage: true };
          return super.dispatchEvent(event);
        }
        if (this.unifiedReasoning.hasMessage) {
          return true;
        }
        this.unifiedReasoning.hasMessage = true;
        return super.dispatchEvent({
          ...event,
          messageId: this.unifiedReasoning.messageId,
        });

      case EventType.REASONING_MESSAGE_CONTENT:
        return this.unifiedReasoning
          ? super.dispatchEvent({
              ...event,
              messageId: this.unifiedReasoning.messageId,
            })
          : super.dispatchEvent(event);

      case EventType.REASONING_ENCRYPTED_VALUE:
        return this.unifiedReasoning
          ? super.dispatchEvent({
              ...event,
              entityId: this.unifiedReasoning.messageId,
            })
          : super.dispatchEvent(event);

      // The base agent emits these at the end of every model phase. Suppress
      // them until the whole run is complete so later tool cycles append to the
      // same reasoning section.
      case EventType.REASONING_MESSAGE_END:
      case EventType.REASONING_END:
        return this.unifiedReasoning ? true : super.dispatchEvent(event);

      // The model has stopped reasoning and started its final answer, so end the
      // reasoning section now rather than waiting for RUN_FINISHED, which only
      // fires after the whole answer has already streamed. Waiting that long
      // left the UI holding a fully-generated answer behind an unclosed
      // reasoning bubble.
      case EventType.TEXT_MESSAGE_START:
        if (this.unifiedReasoning) {
          this.finishUnifiedReasoning();
        }
        return super.dispatchEvent(event);

      case EventType.RUN_FINISHED:
      case EventType.RUN_ERROR:
        this.finishUnifiedReasoning();
        return super.dispatchEvent(event);

      default:
        return super.dispatchEvent(event);
    }
  }

  private finishUnifiedReasoning(): void {
    const reasoning = this.unifiedReasoning;
    this.unifiedReasoning = null;

    if (!reasoning?.hasMessage) {
      return;
    }

    const messageEnd: ReasoningMessageEndEvent = {
      type: EventType.REASONING_MESSAGE_END,
      messageId: reasoning.messageId,
    };
    const reasoningEnd: ReasoningEndEvent = {
      type: EventType.REASONING_END,
      messageId: reasoning.messageId,
    };

    super.dispatchEvent(messageEnd);
    super.dispatchEvent(reasoningEnd);
  }

  // biome-ignore lint/suspicious/noExplicitAny: parent method types are not exported from @ag-ui/langgraph
  override handleSingleEvent(t: any) {
    if (t?.event === "on_chat_model_stream") {
      const chunk = t.data?.chunk;
      const toolCallChunks = chunk?.tool_call_chunks;
      const hasToolCallName = toolCallChunks?.[0]?.name;

      if (hasToolCallName) {
        // biome-ignore lint/suspicious/noExplicitAny: accessing internal state to prevent @ag-ui parser bug
        const activeRunId = (this as any).activeRun?.id;
        // biome-ignore lint/suspicious/noExplicitAny: accessing internal state
        const msgInProgress = (this as any).getMessageInProgress?.(activeRunId);

        // If there is a text message in progress (has an ID but no toolCallId),
        // the base class will forcefully emit TEXT_MESSAGE_END and BREAK out of the switch,
        // entirely swallowing the TOOL_CALL_START event.
        if (msgInProgress?.id && !msgInProgress.toolCallId) {
          // Send an artificial chunk with empty content and NO tool calls.
          // This safely triggers the TEXT_MESSAGE_END branch and clears the message state.
          super.handleSingleEvent({
            ...t,
            data: {
              ...t.data,
              chunk: {
                ...chunk,
                content: "",
                tool_call_chunks: undefined,
              },
            },
          });
        }
      }
    }

    super.handleSingleEvent(t);
  }

  // biome-ignore lint/suspicious/noExplicitAny: parent method types are not exported from @ag-ui/langgraph
  override async prepareStream(input: any, streamMode: any): Promise<any> {
    if (input && Array.isArray(input.messages)) {
      const messages = filterUnsupportedAgUiRoles(input.messages);
      return super.prepareStream({ ...input, messages }, streamMode);
    }
    return super.prepareStream(input, streamMode);
  }
}
