import { requireAdmin } from "@/lib/dal/auth";
import { getContainers, getContainerAnalytics } from "@/lib/dal/containers";
import { ContainersTable } from "./_components/containers-table";
import { ContainerAnalyticsPanel } from "./_components/container-analytics";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";
import Link from "next/link";

export default async function ContainersPage() {
  await requireAdmin();
  const [containers, analytics] = await Promise.all([
    getContainers(),
    getContainerAnalytics(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontenery"
        description={`${containers.length} kontenerów`}
        actions={
          <Link
            href="/containers/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            + Nowy kontener
          </Link>
        }
      />

      <ContainerAnalyticsPanel analytics={analytics} />

      <GlassCard>
        <div className="px-6 py-6">
          <ContainersTable containers={containers} />
        </div>
      </GlassCard>
    </div>
  );
}
