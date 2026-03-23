"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { QuotationRow } from "@/types/quotations";

interface Props {
  quotations: QuotationRow[];
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Szkic",
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  accepted: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const STATUSES = ["", "draft", "sent", "accepted", "rejected"];

export function QuotationsTable({ quotations }: Props) {
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

  const fmt = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("pl-PL").format(new Date(d));

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={sp.get("status") ?? ""}
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
          value={sp.get("customer") ?? ""}
          onChange={(e) => pushFilter("customer", e.target.value)}
          placeholder="Szukaj klienta..."
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none"
        />

        <input
          type="date"
          value={sp.get("from") ?? ""}
          onChange={(e) => pushFilter("from", e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none"
        />

        <input
          type="date"
          value={sp.get("to") ?? ""}
          onChange={(e) => pushFilter("to", e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none"
        />

        {(sp.get("status") || sp.get("customer") || sp.get("from") || sp.get("to")) && (
          <button
            onClick={() => router.push("?")}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Table */}
      {quotations.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm">
          Brak wycen. Kliknij &quot;+ Nowa wycena&quot; aby rozpocząć.
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Numer wyceny</th>
                <th className="px-4 py-3 font-medium">Klient</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Wartość</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr
                  key={q.id}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-aether-blue/80 text-xs">
                    {q.quotationNumber}
                  </td>
                  <td className="px-4 py-3 text-white/90">{q.customerName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-white/80 font-medium">
                    {fmt(q.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(q.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/quotations/${q.id}`}
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
