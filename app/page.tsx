import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDefaultRouteForRole } from "@/lib/auth/roles";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  redirect(getDefaultRouteForRole(session.user?.role));
}
