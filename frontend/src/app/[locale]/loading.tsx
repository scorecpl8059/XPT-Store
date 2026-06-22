export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-ws-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ws-text-muted">Loading...</p>
      </div>
    </div>
  );
}
