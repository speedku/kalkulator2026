"use client";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { SalesAnalyticsRow } from "@/types/analytics";

interface Props {
  monthlyData: SalesAnalyticsRow[];
  wowData: SalesAnalyticsRow[];
}

export function SalesChart({ monthlyData, wowData }: Props) {
  const [mode, setMode] = useState<"monthly" | "weekly">("monthly");
  const data = mode === "monthly" ? monthlyData : wowData;
  const label = mode === "monthly" ? "Przychód miesięczny" : "Przychód tygodniowy";

  return (
    <div className="rounded-xl border border-aether-border bg-aether-surface backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-aether-text-secondary">{label}</h3>
        <div className="flex rounded-lg overflow-hidden border border-aether-border text-xs">
          <button
            onClick={() => setMode("monthly")}
            className={`px-2.5 py-1 transition-colors ${mode === "monthly" ? "bg-aether-blue/20 text-aether-blue" : "text-aether-text-secondary hover:text-aether-text"}`}
          >
            Miesiąc
          </button>
          <button
            onClick={() => setMode("weekly")}
            className={`px-2.5 py-1 transition-colors ${mode === "weekly" ? "bg-aether-blue/20 text-aether-blue" : "text-aether-text-secondary hover:text-aether-text"}`}
          >
            Tydzień
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-aether-text-secondary text-sm">Brak danych</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={60} />
            <Tooltip
              contentStyle={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Przychód (zł)" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="count" name="Liczba wycen" fill="#22d3ee" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
