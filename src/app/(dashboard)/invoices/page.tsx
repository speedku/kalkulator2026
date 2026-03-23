import { requireAdmin } from "@/lib/dal/auth";
import { getInvoices } from "@/lib/dal/invoices";
import { InvoicesTable } from "./_components/invoices-table";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";
import Link from "next/link";

interface SearchParams {
  status?: string;
  from?: string;
  to?: string;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const invoices = await getInvoices({
    status: sp.status,
    from: sp.from ? new Date(sp.from) : undefined,
    to: sp.to ? new Date(sp.to) : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faktury"
        description={`${invoices.length} faktur`}
        actions={
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            + Nowa faktura
          </Link>
        }
      />
      <GlassCard>
        <div className="px-6 py-6">
          <InvoicesTable invoices={invoices} />
        </div>
      </GlassCard>
    </div>
  );
}
