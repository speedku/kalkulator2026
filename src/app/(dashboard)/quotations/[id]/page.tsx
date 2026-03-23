import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getQuotationById } from "@/lib/dal/quotations";
import { QuotationDetail } from "./_components/quotation-detail";
import { QuotationActionsBar } from "./_components/quotation-actions-bar";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import Link from "next/link";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const quotation = await getQuotationById(Number(id));
  if (!quotation) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Wycena ${quotation.quotationNumber}`}
        description={quotation.customerName}
        actions={
          <Link
            href="/quotations"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Lista wycen
          </Link>
        }
      />
      <QuotationActionsBar quotation={quotation} />
      <GlassCard>
        <div className="px-6 py-6">
          <QuotationDetail quotation={quotation} />
        </div>
      </GlassCard>
    </div>
  );
}
