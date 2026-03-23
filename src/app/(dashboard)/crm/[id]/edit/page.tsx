import { requireAdmin } from "@/lib/dal/auth";
import { getCustomerById } from "@/lib/dal/crm";
import { getPriceLists } from "@/lib/dal/price-lists";
import { PageHeader } from "@/components/aether/page-header";
import { CustomerForm } from "../../_components/customer-form";
import { notFound } from "next/navigation";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [customer, priceLists] = await Promise.all([
    getCustomerById(Number(id)),
    getPriceLists(),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edytuj: ${customer.name}`}
        description="Zaktualizuj dane klienta"
      />
      <CustomerForm mode="edit" priceLists={priceLists} customer={customer} />
    </div>
  );
}
