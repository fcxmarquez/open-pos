"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { AdminDashboardScreen } from "@/components/admin/dashboard-screen";

export default function AdminDashboardPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AdminDashboardScreen />
    </CopilotKit>
  );
}
