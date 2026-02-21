import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md",
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-[#0F1B2D]">{value}</p>
      {trend && (
        <div className="mt-1 flex items-center gap-1">
          <span className={cn(
            "inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold",
            trend.value >= 0
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          )}>
            {trend.value >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
