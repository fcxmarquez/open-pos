import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDefaultRouteForRole } from "@/lib/auth/roles";
import { isDemoMode } from "@/lib/demo";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect(isDemoMode() ? "/demo-signin" : "/login");
  }

  redirect(getDefaultRouteForRole(session.user?.role));
}
