import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal/auth";
import { getContainerById } from "@/lib/dal/containers";
import { getProductsForBuilder } from "@/lib/dal/products";
import { ContainerDetail } from "./_components/container-detail";
import { PageHeader } from "@/components/aether/page-header";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContainerDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const container = await getContainerById(Number(id));

  if (!container) {
    notFound();
  }

  const products = await getProductsForBuilder();

  return (
    <div className="space-y-6">
      <PageHeader
        title={container.containerNumber}
        description={`${container.portOfOrigin} → ${container.portOfDestination}`}
      />
      <ContainerDetail container={container} products={products} />
    </div>
  );
}
