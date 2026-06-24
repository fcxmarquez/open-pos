import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { createMiddleware } from "langchain";

type ContentBlock = {
  type?: string;
  text?: string;
  thought?: boolean;
  [key: string]: unknown;
};

function isReasoningBlock(block: ContentBlock): boolean {
  return (
    block.type === "thinking" || block.type === "reasoning" || block.thought === true
  );
}

function visibleTextFromContent(content: BaseMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }

  return (content as ContentBlock[])
    .filter((block) => !isReasoningBlock(block))
    .filter(
      (block): block is ContentBlock & { text: string } => typeof block.text === "string"
    )
    .map((block) => block.text)
    .join("");
}

/**
 * Do not replay prior thinking/reasoning tokens back into the model. They are
 * useful for the UI while streaming, but the next turn only needs visible
 * assistant text plus preserved tool-call metadata and tool result messages.
 */
export const stripReasoningFromHistory = createMiddleware({
  name: "strip-reasoning-from-history",
  wrapModelCall: async (request, handler) => {
    return handler({
      ...request,
      messages: request.messages.map((message) => {
        if (message.type !== "ai" || !Array.isArray(message.content)) {
          return message;
        }

        return new AIMessage({
          content: visibleTextFromContent(message.content),
          tool_calls: (message as AIMessage).tool_calls,
          response_metadata: message.response_metadata,
          additional_kwargs: message.additional_kwargs,
          id: message.id,
        });
      }),
    });
  },
});
