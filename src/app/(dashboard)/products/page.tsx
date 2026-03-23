import { requireAuth } from "@/lib/dal/auth";
import { getProducts } from "@/lib/dal/products";
import { getCategories, getProductGroups } from "@/lib/dal/product-categories";
import { PageHeader } from "@/components/aether/page-header";
import { ProductsTable } from "./_components/products-table";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; group?: string }>;
}) {
  await requireAuth();
  const { page = "1", q = "", category = "", group = "" } = await searchParams;
  const [{ products, total }, categories, groups] = await Promise.all([
    getProducts({
      page: Math.max(1, parseInt(page) || 1),
      pageSize: 20,
      search: q || undefined,
      categoryId: category ? parseInt(category) : undefined,
      groupId: group ? parseInt(group) : undefined,
    }),
    getCategories(),
    getProductGroups(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produkty"
        description={`${total} produktów w katalogu`}
        actions={
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            + Nowy produkt
          </Link>
        }
      />
      <ProductsTable
        data={products}
        total={total}
        categories={categories}
        groups={groups}
        currentPage={parseInt(page) || 1}
        currentSearch={q}
        currentCategory={category}
        currentGroup={group}
      />
    </div>
  );
}
