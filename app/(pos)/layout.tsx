"use client";

import { AppShell } from "@/components/pos/app-shell";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
