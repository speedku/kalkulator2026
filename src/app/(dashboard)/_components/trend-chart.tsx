"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TrendDataPoint } from "@/types/dashboard";

export function TrendChart({ data }: { data: TrendDataPoint[] }) {
  return (
    <div className="rounded-xl border border-aether-border bg-aether-surface backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold text-aether-text-secondary mb-4">Trend wycen (12 tygodni)</h3>
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-aether-text-secondary text-sm">
          Brak danych
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="revenue" stroke="#6b7280" tick={{ fontSize: 11 }} width={60} />
            <YAxis yAxisId="count" orientation="right" stroke="#6b7280" tick={{ fontSize: 11 }} width={30} />
            <Tooltip
              contentStyle={{
                background: "#0d0d1e",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name="Przychód (zł)"
              stroke="#6366f1"
              fill="rgba(99,102,241,0.12)"
              strokeWidth={2}
            />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="count"
              name="Liczba wycen"
              stroke="#22d3ee"
              fill="rgba(34,211,238,0.08)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
