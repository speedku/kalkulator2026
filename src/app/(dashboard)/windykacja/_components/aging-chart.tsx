"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AgingBucket } from "@/lib/dal/windykacja";

interface AgingChartProps {
  buckets: Record<AgingBucket, { count: number; amount: number }>;
}

const BUCKET_CONFIG: {
  key: Exclude<AgingBucket, "current">;
  label: string;
  fill: string;
}[] = [
  { key: "0-30", label: "0–30 dni", fill: "#fbbf24" },
  { key: "31-60", label: "31–60 dni", fill: "#fb923c" },
  { key: "61-90", label: "61–90 dni", fill: "#f87171" },
  { key: "90+", label: "90+ dni", fill: "#b91c1c" },
];

function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface TooltipPayload {
  payload?: { count?: number; [key: string]: unknown };
}

export function AgingChart({ buckets }: AgingChartProps) {
  const data = BUCKET_CONFIG.map(({ key, label, fill }) => ({
    name: label,
    amount: buckets[key].amount,
    count: buckets[key].count,
    fill,
  }));

  const totalAmount = data.reduce((s, d) => s + d.amount, 0);
  if (totalAmount === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-gray-400">Brak przeterminowanych faktur</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v: number) => formatPLN(v)}
          width={90}
        />
        <Tooltip
          contentStyle={{
            background: "#0d0d1e",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: unknown, _name: unknown, props: TooltipPayload) => [
            `${formatPLN(Number(value))} (${props.payload?.count ?? 0} faktur)`,
            "Kwota",
          ]}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
