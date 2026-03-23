import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/dal/auth";
import type { ProductListItem, ProductWithRelations } from "@/types/products";
import type { CreateProductInput } from "@/lib/validations/products";

export async function getProducts(params: {
  page: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  groupId?: number;
  isActive?: boolean;
}): Promise<{ products: ProductListItem[]; total: number }> {
  await requireAuth();
  const { page, pageSize = 20, search, categoryId, groupId, isActive = true } = params;
  const skip = (page - 1) * pageSize;

  const where = {
    isActive,
    ...(search
      ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(groupId ? { productGroupId: groupId } : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        imageUrl: true,
        price: true,
        isActive: true,
        displayOrder: true,
        category: { select: { id: true, name: true } },
        group: { select: { id: true, name: true, backgroundColor: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products as ProductListItem[], total };
}

export async function getProductById(id: number): Promise<ProductWithRelations | null> {
  await requireAuth();
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      group: true,
      variants: { include: { prices: true }, orderBy: { displayOrder: "asc" } },
    },
  }) as Promise<ProductWithRelations | null>;
}

export async function createProduct(data: CreateProductInput) {
  await requireAdmin();
  return prisma.product.create({ data });
}

export async function updateProduct(id: number, data: Partial<CreateProductInput>) {
  await requireAdmin();
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  return prisma.product.update({ where: { id }, data: { isActive: false } }); // soft delete
}

export async function bulkDeleteProducts(ids: number[]) {
  await requireAdmin();
  return prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });
}

// ─── Quotation builder ────────────────────────────────────────────────────────

export interface BuilderProduct {
  id: number;
  name: string;
  sku: string | null;
  purchasePrice: number | null; // mapped from product.price (purchase cost field)
  productGroupId: number | null;
}

export async function getProductsForBuilder(): Promise<BuilderProduct[]> {
  await requireAuth();
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      productGroupId: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    purchasePrice: r.price !== null ? Number(r.price) : null,
    productGroupId: r.productGroupId,
  }));
}
