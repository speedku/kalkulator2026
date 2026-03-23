import { requireAdmin } from "@/lib/dal/auth";
import { getAgingData } from "@/lib/dal/windykacja";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { AgingChart } from "./_components/aging-chart";
import { OverdueTable } from "./_components/overdue-table";

function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

const BUCKET_LABELS = {
  "0-30": "0–30 dni",
  "31-60": "31–60 dni",
  "61-90": "61–90 dni",
  "90+": "90+ dni",
} as const;

const BUCKET_COLORS = {
  "0-30": "text-amber-300",
  "31-60": "text-orange-300",
  "61-90": "text-red-400",
  "90+": "text-red-500",
} as const;

export default async function WindykacjaPage() {
  await requireAdmin();
  const { rows, summary } = await getAgingData();

  const overdueBuckets = (
    ["0-30", "31-60", "61-90", "90+"] as const
  ).map((key) => ({
    key,
    label: BUCKET_LABELS[key],
    color: BUCKET_COLORS[key],
    ...summary.buckets[key],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Windykacja — Przeterminowane płatności"
        description={`${summary.countOverdue} faktur na łączną kwotę ${formatPLN(summary.totalOverdue)}`}
      />

      {/* Totals stat */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {overdueBuckets.map((b) => (
          <GlassCard key={b.key} className="px-6 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {b.label}
            </p>
            <p className={`mt-2 text-2xl font-bold font-display ${b.color}`}>
              {b.count}
            </p>
            <p className="mt-0.5 text-sm text-gray-400">
              {formatPLN(b.amount)}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Chart */}
      <GlassCard className="px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          Rozkład przeterminowań (PLN)
        </h2>
        <AgingChart buckets={summary.buckets} />
      </GlassCard>

      {/* Overdue invoices table */}
      <GlassCard className="px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          Przeterminowane faktury
        </h2>
        <OverdueTable rows={rows} />
      </GlassCard>
    </div>
  );
}
