import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent text-foreground-inverse",
        secondary: "bg-background-tertiary text-foreground-secondary",
        success: "bg-status-success-bg text-status-success",
        error: "bg-status-error-bg text-status-error",
        warning: "bg-status-warning-bg text-status-warning",
        info: "bg-status-info-bg text-status-info",
        outline: "border border-border text-foreground-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
