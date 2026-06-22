import * as React from "react";
import { cn } from "@/lib/utils";

const WsCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hoverable?: boolean;
  }
>(({ className, hoverable = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg bg-ws-surface border border-ws-border p-5 transition-colors duration-150",
        hoverable && "hover:border-ws-border-light hover:bg-ws-surface-hover",
        className
      )}
      {...props}
    />
  );
});
WsCard.displayName = "WsCard";

const WsCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 pb-3", className)}
    {...props}
  />
));
WsCardHeader.displayName = "WsCardHeader";

const WsCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold text-ws-text", className)}
    {...props}
  />
));
WsCardTitle.displayName = "WsCardTitle";

const WsCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-ws-text-secondary", className)}
    {...props}
  />
));
WsCardContent.displayName = "WsCardContent";

const WsCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-3 border-t border-ws-border",
      className
    )}
    {...props}
  />
));
WsCardFooter.displayName = "WsCardFooter";

export { WsCard, WsCardHeader, WsCardTitle, WsCardContent, WsCardFooter };
