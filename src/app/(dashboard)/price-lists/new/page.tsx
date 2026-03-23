import { requireAdmin } from "@/lib/dal/auth";
import { PageHeader } from "@/components/aether/page-header";
import { PriceListForm } from "../[id]/_components/price-list-form";

export default async function NewPriceListPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nowy cennik"
        description="Utwórz nowy cennik w systemie"
      />
      <PriceListForm mode="create" />
    </div>
  );
}
