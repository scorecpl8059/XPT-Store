import * as React from "react";
import { cn } from "@/lib/utils";

const WsInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-ws-border bg-ws-elevated px-3 py-2 text-sm text-ws-text placeholder:text-ws-text-muted transition-colors duration-150",
        "focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
WsInput.displayName = "WsInput";

const WsTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-ws-border bg-ws-elevated px-3 py-2 text-sm text-ws-text placeholder:text-ws-text-muted transition-colors duration-150 resize-y",
        "focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
WsTextarea.displayName = "WsTextarea";

const WsLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-ws-text-secondary", className)}
      {...props}
    />
  );
});
WsLabel.displayName = "WsLabel";

export { WsInput, WsTextarea, WsLabel };
