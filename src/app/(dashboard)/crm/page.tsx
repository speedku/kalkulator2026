import { requireAdmin } from "@/lib/dal/auth";
import { getCustomers } from "@/lib/dal/crm";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { CustomerTable } from "./_components/customer-table";
import Link from "next/link";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; active?: string }>;
}) {
  await requireAdmin();
  const { search, active } = await searchParams;

  const isActive = active !== "false";

  const customers = await getCustomers({
    search: search || undefined,
    isActive,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Klienci CRM"
        description={`${customers.length} klientów`}
        actions={
          <Link
            href="/crm/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            + Nowy klient
          </Link>
        }
      />
      <GlassCard className="px-6 py-6">
        <CustomerTable customers={customers} total={customers.length} />
      </GlassCard>
    </div>
  );
}
