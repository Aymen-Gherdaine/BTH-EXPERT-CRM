import { cn } from "@/lib/utils";

type BadgeStatus = "accepted" | "pending" | "refused" | "draft";

type BadgeProps = {
  status: BadgeStatus;
  className?: string;
  children?: React.ReactNode;
};

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  accepted: {
    label: "Accepté",
    className: "bg-[rgba(58,122,80,0.12)] text-bth-success",
  },
  pending: {
    label: "En attente",
    className: "bg-[rgba(201,169,110,0.12)] text-bth-gold-600",
  },
  refused: {
    label: "Refusé",
    className: "bg-[rgba(196,74,58,0.12)] text-bth-error",
  },
  draft: {
    label: "Brouillon",
    className: "bg-bth-n-100 text-bth-n-600",
  },
};

export function Badge({ status, className, children }: BadgeProps) {
  const { label, className: statusClassName } = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
        statusClassName,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      {children ?? label}
    </span>
  );
}
