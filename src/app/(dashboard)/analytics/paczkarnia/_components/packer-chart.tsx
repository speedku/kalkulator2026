"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { PackerStatRow } from "@/types/analytics";

export function PackerChart({ data }: { data: PackerStatRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center flex-col gap-2">
        <p className="text-aether-text-secondary text-sm">Brak danych z paczkarni</p>
        <p className="text-aether-text-secondary text-xs">Tabela packer_live_stats jest pusta lub niedostępna</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="packages" name="Paczki" fill="#6366f1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="packers" name="Pakowaczy" fill="#22d3ee" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
