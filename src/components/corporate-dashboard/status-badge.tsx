import { cn } from "@/lib/utils";

type BookingStatus =
  | "booked"
  | "confirmed"
  | "pending_approval"
  | "cancelled"
  | "pending"
  | "approved"
  | "rejected";

const statusConfig: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
  booked: { bg: "bg-green-50", text: "text-green-700", label: "Booked" },
  confirmed: { bg: "bg-green-50", text: "text-green-700", label: "Confirmed" },
  approved: { bg: "bg-green-50", text: "text-green-700", label: "Approved" },
  pending_approval: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending Approval", pulse: true },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending", pulse: true },
  cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
  rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};

interface StatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    label: status.replace(/_/g, " "),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        config.bg,
        config.text,
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            status === "pending" || status === "pending_approval" ? "bg-yellow-400" : "bg-gray-400"
          )} />
          <span className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            status === "pending" || status === "pending_approval" ? "bg-yellow-500" : "bg-gray-500"
          )} />
        </span>
      )}
      {config.label}
    </span>
  );
}
