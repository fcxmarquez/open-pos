import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type React from "react";
import { IOSViewportFix } from "@/components/ios-viewport-fix";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { STORE_NAME } from "@/lib/constants/store";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: t("pageTitle", { storeName: STORE_NAME }),
    description: t("pageDescription"),
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}>
        <IOSViewportFix />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster position="top-right" closeButton />
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
