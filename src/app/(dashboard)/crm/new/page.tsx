import { requireAdmin } from "@/lib/dal/auth";
import { getPriceLists } from "@/lib/dal/price-lists";
import { PageHeader } from "@/components/aether/page-header";
import { CustomerForm } from "../_components/customer-form";

export default async function NewCustomerPage() {
  await requireAdmin();
  const priceLists = await getPriceLists();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nowy klient"
        description="Dodaj nowego klienta do systemu CRM"
      />
      <CustomerForm mode="create" priceLists={priceLists} />
    </div>
  );
}
