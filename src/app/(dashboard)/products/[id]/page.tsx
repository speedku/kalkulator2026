import { requireAdmin } from "@/lib/dal/auth";
import { getProductById } from "@/lib/dal/products";
import { getCategories, getProductGroups } from "@/lib/dal/product-categories";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/aether/page-header";
import { ProductDetailForm } from "./_components/product-detail-form";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params; // await params — Next.js 15 requirement
  const productId = parseInt(id);
  if (isNaN(productId)) notFound();
  const [product, categories, groups] = await Promise.all([
    getProductById(productId),
    getCategories(),
    getProductGroups(),
  ]);
  if (!product) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title={product.name} description={`SKU: ${product.sku ?? "—"}`} />
      <ProductDetailForm product={product} categories={categories} groups={groups} />
    </div>
  );
}
