"use client";

import type { ContainerStatus } from "@/types/containers";

const STATUS_CONFIG: Record<
  ContainerStatus,
  { label: string; className: string }
> = {
  in_transit: {
    label: "W drodze",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  at_port: {
    label: "W porcie",
    className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  unloaded: {
    label: "Rozładowany",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  completed: {
    label: "Gotowy",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
};

export function ContainerStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as ContainerStatus] ?? {
    label: status,
    className: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
