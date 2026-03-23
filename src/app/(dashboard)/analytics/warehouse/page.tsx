import { requireAdmin } from "@/lib/dal/auth";
import { getDeadStock, getWarehouseKpis } from "@/lib/dal/analytics";
import { PageHeader } from "@/components/aether/page-header";
import { StatCard } from "@/components/aether/stat-card";
import { DeadStockTable } from "./_components/dead-stock-table";
import { Ship, CheckCircle, DollarSign } from "lucide-react";

export default async function WarehousePage() {
  await requireAdmin();
  const [kpis, deadStock] = await Promise.all([
    getWarehouseKpis(),
    getDeadStock(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Dashboard Magazynu" description="Stan zapasów, kontenery, martwe zapasy" />
        <a
          href="/kalkulator2026/api/analytics/export?report=dead-stock"
          download
          className="inline-flex items-center gap-2 rounded-lg border border-aether-border px-3 py-1.5 text-sm text-aether-text-secondary hover:border-aether-blue/60 hover:text-aether-text transition-colors"
        >
          Eksportuj Excel
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Kontenery w drodze"
          value={kpis.containersInTransit}
          icon={Ship}
        />
        <StatCard
          label="Kontenery ukończone"
          value={kpis.containersCompleted}
          icon={CheckCircle}
        />
        <StatCard
          label="Łączna wartość (USD)"
          value={`$${kpis.totalContainerValueUsd.toLocaleString("pl-PL", { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
        />
      </div>
      <DeadStockTable rows={deadStock} />
    </div>
  );
}
