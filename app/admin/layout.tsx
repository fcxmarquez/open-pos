import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { isAdminRole } from "@/lib/auth/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!isAdminRole(session.user?.role)) {
    redirect("/ventas");
  }

  return <AdminShell>{children}</AdminShell>;
}
