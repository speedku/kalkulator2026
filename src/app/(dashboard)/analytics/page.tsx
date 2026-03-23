import { requireAdmin } from "@/lib/dal/auth";
import { getSalesAnalytics, getYoYComparison, getWoWComparison, getTopProducts } from "@/lib/dal/analytics";
import { PageHeader } from "@/components/aether/page-header";
import { SalesChart } from "./_components/sales-chart";
import { YoYChart } from "./_components/yoy-chart";
import { TopProductsTable } from "./_components/top-products-table";

export default async function AnalyticsPage() {
  await requireAdmin();
  const [monthly, yoy, wow, topProducts] = await Promise.all([
    getSalesAnalytics(),
    getYoYComparison(),
    getWoWComparison(),
    getTopProducts(10),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Analityka sprzedaży" description="Przychody, trendy i top produkty" />
        <a
          href="/kalkulator2026/api/analytics/export?report=sales"
          download
          className="inline-flex items-center gap-2 rounded-lg border border-aether-border px-3 py-1.5 text-sm text-aether-text-secondary hover:border-aether-blue/60 hover:text-aether-text transition-colors"
        >
          Eksportuj Excel
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart monthlyData={monthly} wowData={wow} />
        <YoYChart data={yoy} />
      </div>
      <TopProductsTable rows={topProducts} />
    </div>
  );
}
