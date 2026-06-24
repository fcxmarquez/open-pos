import { describe, expect, test } from "bun:test";
import { EventType } from "@ag-ui/client";
import {
  filterUnsupportedAgUiRoles,
  GoogleAwareLangGraphAgent,
  normalizeStoredContent,
} from "./google-aware-langgraph-agent";

// Minimal fake LangGraph SDK client. Only `threads.getState` is exercised here
// (the constructor wraps it); nothing in these tests hits the network.
function makeFakeClient(state: unknown) {
  return { threads: { getState: async (_threadId: string) => state } };
}

function makeAgent(state: unknown = { values: {} }) {
  // The real config type wants the SDK client; the fake is enough for these
  // unit tests, and this file is excluded from the app's tsc.
  return new GoogleAwareLangGraphAgent({
    deploymentUrl: "http://localhost:8123",
    graphId: "default",
    client: makeFakeClient(state),
  } as unknown as ConstructorParameters<typeof GoogleAwareLangGraphAgent>[0]);
}

type RecordedEvent = {
  type: unknown;
  messageId?: string;
  delta?: string;
};

describe("filtering unsupported AG-UI roles", () => {
  test("drops reasoning, activity, and developer roles", () => {
    const messages = [
      { role: "user", content: "hi" },
      { role: "reasoning", content: "thinking" },
      { role: "assistant", content: "hello" },
      { role: "activity", content: "..." },
      { role: "developer", content: "sys" },
      { role: "tool", content: "result" },
      { role: "system", content: "rules" },
    ];
    const kept = filterUnsupportedAgUiRoles(messages).map((m) => m.role);
    expect(kept).toEqual(["user", "assistant", "tool", "system"]);
  });

  test("keeps every message when none are unsupported", () => {
    const messages = [{ role: "user" }, { role: "assistant" }];
    expect(filterUnsupportedAgUiRoles(messages)).toHaveLength(2);
  });
});

describe("normalizing stored message content", () => {
  test("concatenates multiple text blocks into a single string", () => {
    const out = normalizeStoredContent([
      { type: "text", text: "Hola " },
      { type: "text", text: "mundo" },
    ]);
    expect(out).toBe("Hola mundo");
  });

  test("preserves non-text blocks and appends the merged text", () => {
    const out = normalizeStoredContent([
      { type: "tool_use", id: "t1" },
      { type: "text", text: "a" },
      { type: "text", text: "b" },
    ]);
    expect(out).toEqual([
      { type: "tool_use", id: "t1" },
      { type: "text", text: "ab" },
    ]);
  });

  test("supports bare string blocks", () => {
    expect(normalizeStoredContent(["foo", "bar"])).toBe("foobar");
  });

  test("returns non-array content unchanged", () => {
    expect(normalizeStoredContent("already a string")).toBe("already a string");
  });

  test("returns the array unchanged when it has no text blocks", () => {
    const content = [{ type: "tool_use", id: "t1" }];
    expect(normalizeStoredContent(content)).toBe(content);
  });
});

describe("getState wrapper (constructor)", () => {
  test("concatenates split text blocks across messages in the thread state", async () => {
    const agent = makeAgent({
      values: {
        messages: [
          {
            content: [
              { type: "text", text: "Hola " },
              { type: "text", text: "mundo" },
            ],
          },
          {
            content: [
              { type: "tool_use", id: "t1" },
              { type: "text", text: "x" },
              { type: "text", text: "y" },
            ],
          },
          { content: "plain string stays" },
        ],
      },
    });

    const state = (await agent.client.threads.getState("thread-1")) as {
      values: { messages: Array<{ content: unknown }> };
    };
    expect(state.values.messages[0].content).toBe("Hola mundo");
    expect(state.values.messages[1].content).toEqual([
      { type: "tool_use", id: "t1" },
      { type: "text", text: "xy" },
    ]);
    expect(state.values.messages[2].content).toBe("plain string stays");
  });
});

describe("dispatchEvent unified reasoning", () => {
  test("merges several model-call reasoning phases into one UI reasoning message", () => {
    const agent = makeAgent();
    const captured: RecordedEvent[] = [];
    // `subscriber` is protected; set it directly to capture forwarded events.
    Reflect.set(agent, "subscriber", {
      next: (event: RecordedEvent) => captured.push(event),
      error: () => {},
      complete: () => {},
    });

    const A = "reason-A";
    const B = "reason-B";
    // A ReAct turn does several model calls (plan a tool, then answer). AG-UI
    // opens a reasoning message per call; the adapter must collapse them to one.
    const sequence = [
      { type: EventType.RUN_STARTED, threadId: "t", runId: "r" },
      { type: EventType.REASONING_START, messageId: A },
      { type: EventType.REASONING_MESSAGE_START, messageId: A, role: "reasoning" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: A, delta: "plan " },
      { type: EventType.REASONING_MESSAGE_END, messageId: A },
      { type: EventType.REASONING_END, messageId: A },
      // second model call — new ids that must be folded into the first section
      { type: EventType.REASONING_START, messageId: B },
      { type: EventType.REASONING_MESSAGE_START, messageId: B, role: "reasoning" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: B, delta: "answer" },
      { type: EventType.REASONING_MESSAGE_END, messageId: B },
      { type: EventType.REASONING_END, messageId: B },
      { type: EventType.RUN_FINISHED, threadId: "t", runId: "r" },
    ];
    for (const event of sequence) {
      agent.dispatchEvent(event as unknown as Parameters<typeof agent.dispatchEvent>[0]);
    }

    const byType = (type: EventType) => captured.filter((event) => event.type === type);

    // Exactly one reasoning section is opened, regardless of model-call count.
    expect(byType(EventType.REASONING_START)).toHaveLength(1);
    expect(byType(EventType.REASONING_MESSAGE_START)).toHaveLength(1);

    // Both phases' content is rewritten onto the first message id.
    const contents = byType(EventType.REASONING_MESSAGE_CONTENT);
    expect(contents).toHaveLength(2);
    expect(contents.every((event) => event.messageId === A)).toBe(true);
    expect(contents.map((event) => event.delta)).toEqual(["plan ", "answer"]);

    // The section is closed exactly once, at run end, on the first id.
    const messageEnds = byType(EventType.REASONING_MESSAGE_END);
    const reasoningEnds = byType(EventType.REASONING_END);
    expect(messageEnds).toHaveLength(1);
    expect(reasoningEnds).toHaveLength(1);
    expect(messageEnds[0].messageId).toBe(A);
    expect(reasoningEnds[0].messageId).toBe(A);

    // The second message id never leaks into the forwarded stream.
    expect(captured.some((event) => event.messageId === B)).toBe(false);
    expect(byType(EventType.RUN_FINISHED)).toHaveLength(1);
  });
});
