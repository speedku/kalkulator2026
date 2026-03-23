import { requireAdmin } from "@/lib/dal/auth";
import { getCategories, getProductGroups } from "@/lib/dal/product-categories";
import { PageHeader } from "@/components/aether/page-header";
import { ProductForm } from "./_components/product-form";

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, groups] = await Promise.all([getCategories(), getProductGroups()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Nowy produkt" description="Utwórz nowy produkt w katalogu" />
      <ProductForm categories={categories} groups={groups} />
    </div>
  );
}
