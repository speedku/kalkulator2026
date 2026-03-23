"use client";

import type { DomesticDeliveryStatus } from "@/types/domestic-deliveries";

interface Props {
  status: DomesticDeliveryStatus | string;
}

const DOMESTIC_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Oczekuje",
    className: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  },
  in_transit: {
    label: "W drodze",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  delivered: {
    label: "Dostarczona",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  cancelled: {
    label: "Anulowana",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

export function DeliveryStatusBadge({ status }: Props) {
  const config = DOMESTIC_STATUS_CONFIG[status] ?? {
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
