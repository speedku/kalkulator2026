import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal/auth";
import { getDomesticDeliveryById } from "@/lib/dal/domestic-deliveries";
import { DeliveryDetail } from "./_components/delivery-detail";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeliveryDetailPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const delivery = await getDomesticDeliveryById(Number(id));
  if (!delivery) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={delivery.name}
        description={`Dostawca: ${delivery.supplier}`}
        actions={
          <Link
            href="/deliveries"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Powrót do listy
          </Link>
        }
      />
      <GlassCard>
        <div className="px-6 py-6">
          <DeliveryDetail delivery={delivery} />
        </div>
      </GlassCard>
    </div>
  );
}
