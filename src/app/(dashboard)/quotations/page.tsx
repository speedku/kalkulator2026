import { requireAuth } from "@/lib/dal/auth";
import { getQuotations } from "@/lib/dal/quotations";
import { QuotationsTable } from "./_components/quotations-table";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";
import Link from "next/link";

interface SearchParams {
  status?: string;
  customer?: string;
  from?: string;
  to?: string;
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const quotations = await getQuotations({
    status: sp.status,
    customerName: sp.customer,
    from: sp.from ? new Date(sp.from) : undefined,
    to: sp.to ? new Date(sp.to) : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wyceny"
        description={`${quotations.length} wycen`}
        actions={
          <Link
            href="/quotations/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            + Nowa wycena
          </Link>
        }
      />
      <GlassCard>
        <div className="px-6 py-6">
          <QuotationsTable quotations={quotations} />
        </div>
      </GlassCard>
    </div>
  );
}
