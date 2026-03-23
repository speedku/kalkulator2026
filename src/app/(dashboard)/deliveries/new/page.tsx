import { requireAdmin } from "@/lib/dal/auth";
import { DeliveryForm } from "./_components/delivery-form";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";

export default async function NewDeliveryPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nowa dostawa"
        description="Utwórz nową dostawę krajową"
      />
      <GlassCard>
        <div className="px-6 py-6">
          <DeliveryForm />
        </div>
      </GlassCard>
    </div>
  );
}
