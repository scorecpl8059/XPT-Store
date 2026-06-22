"use client";

import { WsButton } from "@/components/ui/cyber-button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-ws-surface border border-ws-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex items-start gap-3">
          {variant === "destructive" && (
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-ws-red/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-ws-red" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ws-text">{title}</h3>
            <p className="mt-1 text-sm text-ws-text-secondary">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <WsButton variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </WsButton>
          <WsButton
            variant={variant === "destructive" ? "destructive" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </WsButton>
        </div>
      </div>
    </div>
  );
}
