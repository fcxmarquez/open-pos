import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo";
import { DemoSignInClient } from "./client";

export default function DemoSignInPage() {
  if (!isDemoMode()) redirect("/login");
  return <DemoSignInClient />;
}
