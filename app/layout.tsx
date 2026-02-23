import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Papeleria Luna - Punto de Venta",
  description: "Sistema de punto de venta para papeleria",
};

export const viewport: Viewport = {
  themeColor: "#0c7bb3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
