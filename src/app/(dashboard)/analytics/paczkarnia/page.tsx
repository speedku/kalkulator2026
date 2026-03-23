import { requireAdmin } from "@/lib/dal/auth";
import { getPackerStats } from "@/lib/dal/analytics";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { PackerChart } from "./_components/packer-chart";

export default async function PaczkarniPage() {
  await requireAdmin();

  let stats: Awaited<ReturnType<typeof getPackerStats>> = [];
  try {
    stats = await getPackerStats();
  } catch {
    // packer_live_stats table may not exist or be empty — graceful empty state
    stats = [];
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Analityka Paczkarni" description="Wydajność pakowaczy — ostatnie 7 dni" />
        <a
          href="/kalkulator2026/api/analytics/export?report=paczkarnia"
          download
          className="inline-flex items-center gap-2 rounded-lg border border-aether-border px-3 py-1.5 text-sm text-aether-text-secondary hover:border-aether-blue/60 hover:text-aether-text transition-colors"
        >
          Eksportuj Excel
        </a>
      </div>
      <GlassCard>
        <div className="px-6 py-6">
          <PackerChart data={stats} />
        </div>
      </GlassCard>
    </div>
  );
}
