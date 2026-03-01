"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const;

export function Spinner({ className, size = "sm" }: SpinnerProps) {
  return (
    <Loader2
      className={cn(sizeClasses[size], "animate-spin text-muted-foreground", className)}
    />
  );
}
