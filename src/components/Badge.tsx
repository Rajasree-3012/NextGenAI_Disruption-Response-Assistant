interface BadgeProps {
  value: string;
  variant?: "status" | "priority" | "severity" | "role";
}

const statusColors: Record<string, string> = {
  active: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/25",
  suspended: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25",
  under_review: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25",
  pending: "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/25",
  in_transit: "bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/25",
  delayed: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25",
  delivered: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/25",
  cancelled: "bg-[#4a5e7a]/15 text-[#4a5e7a] border-[#4a5e7a]/25",
  confirmed: "bg-[#00d4c8]/15 text-[#00d4c8] border-[#00d4c8]/25",
  processing: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25",
  shipped: "bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/25",
  at_risk: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25",
};

const priorityColors: Record<string, string> = {
  critical: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25",
  high: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25",
  medium: "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/25",
  low: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/25",
};

const severityColors: Record<string, string> = {
  critical: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25",
  high: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25",
  medium: "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/25",
  low: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/25",
  none: "bg-[#4a5e7a]/15 text-[#4a5e7a] border-[#4a5e7a]/25",
};

const roleColors: Record<string, string> = {
  admin: "bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/25",
  operator: "bg-[#00d4c8]/15 text-[#00d4c8] border-[#00d4c8]/25",
  viewer: "bg-[#7a8fad]/15 text-[#7a8fad] border-[#7a8fad]/25",
};

export default function Badge({ value, variant = "status" }: BadgeProps) {
  const map = variant === "priority" ? priorityColors
    : variant === "severity" ? severityColors
    : variant === "role" ? roleColors
    : statusColors;
  const cls = map[value] ?? "bg-[#4a5e7a]/15 text-[#4a5e7a] border-[#4a5e7a]/25";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase tracking-wide font-medium ${cls}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
