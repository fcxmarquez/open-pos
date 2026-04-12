"use client";

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/v2/styles.css";
import { AdminDashboardScreen } from "@/components/admin/dashboard-screen";

export default function AdminDashboardPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AdminDashboardScreen />
    </CopilotKit>
  );
}
