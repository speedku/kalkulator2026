import { requireAdmin } from "@/lib/dal/auth";
import { getProductsForBuilder } from "@/lib/dal/products";
import { ContainerForm } from "./_components/container-form";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";

export default async function NewContainerPage() {
  await requireAdmin();
  const products = await getProductsForBuilder();

  return (
    <div className="space-y-6">
      <PageHeader title="Nowy kontener" description="Utwórz kontener morski" />
      <GlassCard>
        <div className="px-6 py-6">
          <ContainerForm products={products} />
        </div>
      </GlassCard>
    </div>
  );
}
