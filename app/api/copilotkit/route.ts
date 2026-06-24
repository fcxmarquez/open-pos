import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/auth/roles";
import { GoogleAwareLangGraphAgent } from "@/lib/copilotkit/google-aware-langgraph-agent";

const runtime = new CopilotRuntime({
  agents: {
    default: new GoogleAwareLangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123",
      graphId: "default",
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const POST = async (req: NextRequest) => {
  const session = await auth();

  if (!isAdminRole(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return handler(req);
};
