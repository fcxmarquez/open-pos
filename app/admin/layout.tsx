import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { isAdminRole } from "@/lib/auth/roles";
import { isDemoMode } from "@/lib/demo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect(isDemoMode() ? "/demo-signin" : "/login");
  }

  if (!isDemoMode() && !isAdminRole(session.user?.role)) {
    redirect("/ventas");
  }

  return <AdminShell isDemoMode={isDemoMode()}>{children}</AdminShell>;
}
