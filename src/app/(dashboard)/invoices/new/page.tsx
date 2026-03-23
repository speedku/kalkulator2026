import { requireAdmin } from "@/lib/dal/auth";
import { getProductsForBuilder } from "@/lib/dal/products";
import { InvoiceForm } from "./_components/invoice-form";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";

export default async function NewInvoicePage() {
  await requireAdmin();
  const products = await getProductsForBuilder();
  return (
    <div className="space-y-6">
      <PageHeader title="Nowa faktura" description="Utwórz fakturę VAT" />
      <GlassCard>
        <div className="px-6 py-6">
          <InvoiceForm products={products} />
        </div>
      </GlassCard>
    </div>
  );
}
