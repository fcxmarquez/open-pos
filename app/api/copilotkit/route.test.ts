import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { NextRequest } from "next/server";

const authMock = mock(async () => ({ user: { role: "admin" } }));
const handlerMock = mock(async () => Response.json({ ok: true }));
const originalCopilotEnabled = process.env.NEXT_PUBLIC_COPILOT_ENABLED;

mock.module("@/auth", () => ({
  auth: authMock,
}));

mock.module("@copilotkit/runtime/v2", () => ({
  CopilotRuntime: class CopilotRuntime {},
  createCopilotRuntimeHandler: () => handlerMock,
}));

mock.module("@/lib/copilotkit/google-aware-langgraph-agent", () => ({
  GoogleAwareLangGraphAgent: class GoogleAwareLangGraphAgent {},
}));

function makeRequest() {
  return new Request("http://localhost/api/copilotkit", {
    method: "POST",
  }) as NextRequest;
}

async function postCopilotRequest() {
  const { POST } = await import("./route");
  return POST(makeRequest());
}

describe("CopilotKit route feature flag", () => {
  beforeEach(() => {
    authMock.mockClear();
    handlerMock.mockClear();
    delete process.env.NEXT_PUBLIC_COPILOT_ENABLED;
  });

  afterEach(() => {
    if (originalCopilotEnabled === undefined) {
      delete process.env.NEXT_PUBLIC_COPILOT_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_COPILOT_ENABLED = originalCopilotEnabled;
    }
  });

  test("returns 404 before auth or handler work when Copilot is disabled", async () => {
    const response = await postCopilotRequest();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not Found" });
    expect(authMock).not.toHaveBeenCalled();
    expect(handlerMock).not.toHaveBeenCalled();
  });

  test("keeps admin auth enforcement when Copilot is enabled", async () => {
    process.env.NEXT_PUBLIC_COPILOT_ENABLED = "true";
    authMock.mockResolvedValueOnce({ user: { role: "cashier" } });

    const response = await postCopilotRequest();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(handlerMock).not.toHaveBeenCalled();
  });

  test("forwards enabled admin requests to the Copilot handler", async () => {
    process.env.NEXT_PUBLIC_COPILOT_ENABLED = "true";

    const response = await postCopilotRequest();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(authMock).toHaveBeenCalledTimes(1);
    expect(handlerMock).toHaveBeenCalledTimes(1);
  });
});
