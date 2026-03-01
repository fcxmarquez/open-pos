import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        muted: "border-border bg-muted/40 text-muted-foreground",
        success: "border-success-border bg-success text-success-foreground",
        info: "border-info-border bg-info text-info-foreground",
        warning: "border-warning-border bg-warning text-warning-foreground",
        inverted: "border-transparent bg-primary-foreground/20 text-primary-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
      size: {
        compact: "h-6 gap-1 rounded-md px-2.5 py-1 font-medium",
        chip: "rounded-xl px-2 py-0.5 font-medium",
        pill: "h-7 rounded-full px-2.5 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "chip",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
