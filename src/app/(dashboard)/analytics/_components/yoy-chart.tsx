"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { YoYRow } from "@/types/analytics";

const MONTH_NAMES = ["Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"];

interface MonthPoint {
  month: string;
  [year: string]: string | number;
}

export function YoYChart({ data }: { data: YoYRow[] }) {
  // Pivot: rows indexed by month (1-12), columns are years
  const years = [...new Set(data.map((r) => r.year))].sort();
  const pivoted: MonthPoint[] = Array.from({ length: 12 }, (_, i) => {
    const point: MonthPoint = { month: MONTH_NAMES[i] };
    for (const y of years) {
      const row = data.find((r) => r.year === y && r.month === i + 1);
      point[String(y)] = row ? row.revenue : 0;
    }
    return point;
  });

  const colors = ["#6366f1", "#22d3ee", "#f59e0b"];

  return (
    <div className="rounded-xl border border-aether-border bg-aether-surface backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold text-aether-text-secondary mb-4">Porównanie rok do roku (YoY)</h3>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-aether-text-secondary text-sm">Brak danych</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={pivoted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={60} />
            <Tooltip
              contentStyle={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {years.map((y, i) => (
              <Line
                key={y}
                type="monotone"
                dataKey={String(y)}
                name={String(y)}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
