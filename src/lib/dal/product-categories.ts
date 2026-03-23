import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/dal/auth";
import type { ProductCategory, ProductGroup } from "@/types/products";

export async function getCategories(): Promise<ProductCategory[]> {
  await requireAuth();
  return prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getProductGroups(): Promise<ProductGroup[]> {
  await requireAuth();
  return prisma.productGroup.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createCategory(name: string, slug: string) {
  await requireAdmin();
  return prisma.productCategory.create({ data: { name, slug } });
}

export async function createProductGroup(name: string) {
  await requireAdmin();
  return prisma.productGroup.create({ data: { name } });
}
