import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal/auth";
import { getInvoiceById } from "@/lib/dal/invoices";
import { InvoiceDetail } from "./_components/invoice-detail";
import { InvoiceActionsBar } from "./_components/invoice-actions-bar";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import Link from "next/link";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const invoice = await getInvoiceById(Number(id));
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Faktura ${invoice.invoiceNumber}`}
        description={invoice.customerName}
        actions={
          <Link
            href="/invoices"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Lista faktur
          </Link>
        }
      />
      <InvoiceActionsBar invoice={invoice} />
      <GlassCard>
        <div className="px-6 py-6">
          <InvoiceDetail invoice={invoice} />
        </div>
      </GlassCard>
    </div>
  );
}
