"use client";

import { useEffect } from "react";

export function IOSViewportFix() {
  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (!isIOS) return;

    // biome-ignore lint/security/noSecrets: false positive on CSS selector string
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;

    const content = viewport.getAttribute("content") ?? "";
    if (!content.includes("maximum-scale")) {
      viewport.setAttribute("content", `${content}, maximum-scale=1`);
    }
  }, []);

  return null;
}
