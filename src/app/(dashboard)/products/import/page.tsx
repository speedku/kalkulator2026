import { requireAdmin } from "@/lib/dal/auth";
import { PageHeader } from "@/components/aether/page-header";
import { ImportForm } from "./_components/import-form";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import produktów z Excel"
        description="Prześlij plik .xlsx z kolumnami: name, sku, description, price, category_name, paper_type, grammage, box_quantity, pallet_quantity, image_url, is_active"
      />
      <ImportForm />
    </div>
  );
}
