"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { AdminDashboardScreen } from "@/components/admin/dashboard-screen";

export default function AdminDashboardPage() {
  if (process.env.NEXT_PUBLIC_COPILOT_ENABLED !== "true") {
    return <AdminDashboardScreen />;
  }

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AdminDashboardScreen />
    </CopilotKit>
  );
}
