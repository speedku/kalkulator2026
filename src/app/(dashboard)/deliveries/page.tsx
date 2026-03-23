import { requireAdmin } from "@/lib/dal/auth";
import { getDomesticDeliveries } from "@/lib/dal/domestic-deliveries";
import { DeliveriesTable } from "./_components/deliveries-table";
import { SubiektSyncBtn } from "./_components/subiekt-sync-btn";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";
import Link from "next/link";

export default async function DeliveriesPage() {
  await requireAdmin();
  const deliveries = await getDomesticDeliveries();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dostawy krajowe"
        description={`${deliveries.length} dostaw`}
        actions={
          <div className="flex items-center gap-3">
            <SubiektSyncBtn />
            <Link
              href="/deliveries/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
            >
              + Nowa dostawa
            </Link>
          </div>
        }
      />
      <GlassCard>
        <div className="px-6 py-6">
          <DeliveriesTable deliveries={deliveries} />
        </div>
      </GlassCard>
    </div>
  );
}
