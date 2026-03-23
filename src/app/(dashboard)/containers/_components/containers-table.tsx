"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ContainerRow } from "@/types/containers";
import { ContainerStatusBadge } from "./container-status-badge";

interface Props {
  containers: ContainerRow[];
}

const STATUSES = ["", "in_transit", "at_port", "unloaded", "completed"];
const STATUS_LABELS: Record<string, string> = {
  in_transit: "W drodze",
  at_port: "W porcie",
  unloaded: "Rozładowany",
  completed: "Gotowy",
};

export function ContainersTable({ containers }: Props) {
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

  const fmtDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("pl-PL").format(new Date(d)) : "—";

  const fmtUsd = (v: number | null) =>
    v !== null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
      : "—";

  const statusFilter = sp.get("status") ?? "";
  const carrierFilter = sp.get("carrier") ?? "";

  const filtered = containers.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchCarrier =
      !carrierFilter ||
      c.carrier.toLowerCase().includes(carrierFilter.toLowerCase());
    return matchStatus && matchCarrier;
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

        <input
          type="text"
          value={carrierFilter}
          onChange={(e) => pushFilter("carrier", e.target.value)}
          placeholder="Filtruj po przewoźniku..."
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none"
        />

        {(statusFilter || carrierFilter) && (
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
          Brak kontenerów. Kliknij &quot;+ Nowy kontener&quot; aby dodać pierwszy.
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Numer kontenera</th>
                <th className="px-4 py-3 font-medium">Przewoźnik</th>
                <th className="px-4 py-3 font-medium">Port docelowy</th>
                <th className="px-4 py-3 font-medium">Data załadunku</th>
                <th className="px-4 py-3 font-medium">ETA</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Wartość</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/containers/${c.id}`}
                      className="font-mono text-aether-blue/80 hover:text-aether-blue text-xs transition-colors"
                    >
                      {c.containerNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/90">{c.carrier}</td>
                  <td className="px-4 py-3 text-gray-400">{c.portOfDestination}</td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(c.shipmentDate)}</td>
                  <td className="px-4 py-3 text-gray-300">{fmtDate(c.etaDate)}</td>
                  <td className="px-4 py-3">
                    <ContainerStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">
                    {fmtUsd(c.totalValue)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/containers/${c.id}`}
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
