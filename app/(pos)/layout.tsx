import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/pos/app-shell";
import { isAdminRole } from "@/lib/auth/roles";
import { isDemoMode } from "@/lib/demo";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect(isDemoMode() ? "/demo-signin" : "/login");
  }

  return (
    <AppShell isAdmin={isAdminRole(session.user?.role)} isDemoMode={isDemoMode()}>
      {children}
    </AppShell>
  );
}
