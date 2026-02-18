import { cn } from "@/lib/utils";

type BookingStatus =
  | "booked"
  | "confirmed"
  | "pending_approval"
  | "cancelled"
  | "pending"
  | "approved"
  | "rejected";

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  booked: { bg: "bg-green-50", text: "text-green-700", label: "Booked" },
  confirmed: { bg: "bg-green-50", text: "text-green-700", label: "Confirmed" },
  approved: { bg: "bg-green-50", text: "text-green-700", label: "Approved" },
  pending_approval: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending Approval" },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending" },
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
