import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-clay-500 text-white",
        secondary: "border-transparent bg-forest-500 text-white",
        outline: "border-ink-900/15 text-ink-900 bg-white",
        success: "border-transparent bg-[#2F6B4F] text-white",
        warning: "border-transparent bg-brass-500 text-ink-900",
        destructive: "border-transparent bg-destructive text-white",
        muted: "border-transparent bg-sand-200 text-ink-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
