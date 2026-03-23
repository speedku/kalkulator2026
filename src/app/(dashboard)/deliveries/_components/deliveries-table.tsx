"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { DomesticDeliveryRow } from "@/types/domestic-deliveries";
import { DeliveryStatusBadge } from "./delivery-status-badge";

interface Props {
  deliveries: DomesticDeliveryRow[];
}

const STATUSES = ["", "pending", "in_transit", "delivered", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Oczekuje",
  in_transit: "W drodze",
  delivered: "Dostarczona",
  cancelled: "Anulowana",
};

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("pl-PL").format(new Date(d)) : "—";

export function DeliveriesTable({ deliveries }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const pushFilter = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const statusFilter = sp.get("status") ?? "";

  const filtered = deliveries.filter((d) => {
    return !statusFilter || d.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => pushFilter("status", e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none"
        >
          <option value="">Wszystkie statusy</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {statusFilter && (
          <button
            onClick={() => router.push("?")}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm">
          Brak dostaw.{" "}
          {deliveries.length === 0
            ? 'Kliknij "+ Nowa dostawa" aby dodać pierwszą.'
            : "Zmień filtry, aby zobaczyć wyniki."}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Nazwa dostawy</th>
                <th className="px-4 py-3 font-medium">Dostawca</th>
                <th className="px-4 py-3 font-medium">ETA</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data dostawy</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/deliveries/${d.id}`}
                      className="text-white/90 hover:text-aether-blue transition-colors font-medium"
                    >
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{d.supplier}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {fmtDate(d.etaDate)}
                  </td>
                  <td className="px-4 py-3">
                    <DeliveryStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {fmtDate(d.actualArrivalDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/deliveries/${d.id}`}
                      className="text-aether-blue/70 hover:text-aether-blue text-xs transition-colors"
                    >
                      Szczegóły →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
