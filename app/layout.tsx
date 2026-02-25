import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import type React from "react";
import { Toaster } from "sonner";
import { IOSViewportFix } from "@/components/ios-viewport-fix";
import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Papeleria Luna - Punto de Venta",
  description: "Sistema de punto de venta para papeleria",
};

export const viewport: Viewport = {
  themeColor: "#0c7bb3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <IOSViewportFix />
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
