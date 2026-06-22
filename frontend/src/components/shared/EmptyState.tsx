import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-ws-elevated border border-ws-border flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-ws-text-muted" />
      </div>
      <h3 className="text-sm font-semibold text-ws-text">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-ws-text-muted max-w-sm">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
