import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type React from "react";
import { IOSViewportFix } from "@/components/ios-viewport-fix";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const plusJakartaSans = localFont({
  src: [
    {
      path: "./fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2",
      weight: "500 800",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-heading",
  fallback: ["Inter", "system-ui", "Arial", "sans-serif"],
});

const inter = localFont({
  src: [
    {
      path: "./fonts/inter/inter-latin.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-body",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Papeleria Luna - Punto de Venta",
  description: "Sistema de punto de venta para papeleria",
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
      <body className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}>
        <IOSViewportFix />
        <QueryProvider>
          {children}
          <Toaster position="top-right" closeButton />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
