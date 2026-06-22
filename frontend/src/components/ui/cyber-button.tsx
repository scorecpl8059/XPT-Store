import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const wsButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-md",
  {
    variants: {
      variant: {
        primary:
          "bg-ws-blue text-white hover:bg-ws-blue-hover active:scale-[0.98]",
        secondary:
          "border border-ws-border bg-ws-elevated text-ws-text hover:bg-ws-surface-hover hover:border-ws-border-light active:scale-[0.98]",
        outline:
          "border border-ws-blue/40 text-ws-blue hover:bg-ws-blue/10 hover:border-ws-blue active:scale-[0.98]",
        ghost:
          "text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface active:scale-[0.98]",
        destructive:
          "bg-ws-red text-white hover:bg-ws-red/90 active:scale-[0.98]",
        "destructive-outline":
          "border border-ws-red/40 text-ws-red hover:bg-ws-red/10 hover:border-ws-red active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface WsButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof wsButtonVariants> {}

const WsButton = React.forwardRef<HTMLButtonElement, WsButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(wsButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
WsButton.displayName = "WsButton";

export { WsButton, wsButtonVariants };
