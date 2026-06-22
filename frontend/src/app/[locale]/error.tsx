"use client";

import { WsButton } from "@/components/ui/cyber-button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-ws-red">500</p>
      <h1 className="mt-4 text-xl font-semibold text-ws-text">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-ws-text-muted max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <WsButton variant="primary" className="mt-6" onClick={reset}>
        Try Again
      </WsButton>
    </div>
  );
}
