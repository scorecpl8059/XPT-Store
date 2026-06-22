import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const wsBadgeVariants = cva(
  "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border transition-colors",
  {
    variants: {
      variant: {
        blue: "border-ws-blue/30 text-ws-blue bg-ws-blue/10",
        green: "border-ws-green/30 text-ws-green bg-ws-green/10",
        amber: "border-ws-amber/30 text-ws-amber bg-ws-amber/10",
        red: "border-ws-red/30 text-ws-red bg-ws-red/10",
        purple:
          "border-violet-500/30 text-violet-600 bg-violet-500/10",
        muted:
          "border-ws-border text-ws-text-muted bg-ws-elevated",
      },
    },
    defaultVariants: {
      variant: "blue",
    },
  }
);

export interface WsBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof wsBadgeVariants> {
  dot?: boolean;
}

const WsBadge = React.forwardRef<HTMLSpanElement, WsBadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(wsBadgeVariants({ variant, className }))}
        {...props}
      >
        {dot && (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
        {children}
      </span>
    );
  }
);
WsBadge.displayName = "WsBadge";

export { WsBadge, wsBadgeVariants };
