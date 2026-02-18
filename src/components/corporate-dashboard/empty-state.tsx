import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
  cta?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, message, cta, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <p className="mt-3 text-sm text-gray-500">{message}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
