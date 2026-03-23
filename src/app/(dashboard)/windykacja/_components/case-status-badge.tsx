"use client";

interface CaseStatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Otwarta",
  reminded: "Przypomniana",
  in_dispute: "W sporze",
  settled: "Rozliczona",
  written_off: "Odpisana",
};

const STATUS_CLASSES: Record<string, string> = {
  open: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  reminded: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  in_dispute: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  settled: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  written_off: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
};

export function CaseStatusBadge({ status }: CaseStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  const cls =
    STATUS_CLASSES[status] ??
    "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
