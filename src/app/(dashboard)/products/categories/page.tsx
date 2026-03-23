import { requireAdmin } from "@/lib/dal/auth";
import { getCategories, getProductGroups } from "@/lib/dal/product-categories";
import { PageHeader } from "@/components/aether/page-header";
import { CategoriesTable } from "./_components/categories-table";

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, groups] = await Promise.all([getCategories(), getProductGroups()]);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Kategorie i grupy produktów"
        description="Zarządzaj strukturą katalogu"
      />
      <CategoriesTable categories={categories} groups={groups} />
    </div>
  );
}
