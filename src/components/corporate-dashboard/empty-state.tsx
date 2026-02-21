import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  title?: string;
  message: string;
  hint?: string;
  cta?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, hint, cta, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      {title && (
        <h3 className="mt-4 text-sm font-semibold text-[#0F1B2D]">{title}</h3>
      )}
      <p className={cn("max-w-sm text-sm text-gray-500", title ? "mt-1" : "mt-4")}>
        {message}
      </p>
      {hint && (
        <p className="mt-2 max-w-xs text-xs text-gray-400">{hint}</p>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
