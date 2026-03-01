"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--toast-background))] group-[.toaster]:text-white border-none group-[.toaster]:shadow-lg",
          success: "group-[.toaster]:!text-success-foreground",
          error: "group-[.toaster]:!text-error-foreground",
          warning: "group-[.toaster]:!text-warning-foreground",
          info: "group-[.toaster]:!text-info-foreground",
          icon: "group-[.toast]:text-current",
          title: "group-[.toast]:text-current font-medium",
          description: "group-[.toast]:!text-white opacity-90",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
