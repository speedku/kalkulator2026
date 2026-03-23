import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/dal/auth";
import type { PriceListRow, PriceListWithMargins, MarginMatrixEntry } from "@/types/price-lists";
import type {
  CreatePriceListInput,
  UpdatePriceListInput,
} from "@/lib/validations/price-lists";

// ─── Pricing formula ──────────────────────────────────────────────────────────
// Source: kalkulator2025/api/price-lists.php — gross margin formula (NOT markup)
// salePrice = cost / (1 - marginPercent/100)
// Example: cost=10.00, margin=80% → salePrice = 10 / (1 - 0.80) = 50.00
// Example: cost=10.00, margin=50% → salePrice = 10 / (1 - 0.50) = 20.00
export function calculateSalePrice(
  purchasePrice: number | { toNumber(): number },
  marginPercent: number | { toNumber(): number }
): number {
  const cost = typeof purchasePrice === "number" ? purchasePrice : purchasePrice.toNumber();
  const margin = typeof marginPercent === "number" ? marginPercent : marginPercent.toNumber();
  if (margin >= 100) throw new Error("Marża nie może być >= 100%");
  if (cost <= 0) throw new Error("Cena zakupu musi być > 0");
  return Math.round((cost / (1 - margin / 100)) * 100) / 100;
}

// ─── Price List CRUD ──────────────────────────────────────────────────────────

export async function getPriceLists(): Promise<PriceListRow[]> {
  await requireAuth();
  return prisma.priceList.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isActive: true,
      displayOrder: true,
      createdAt: true,
    },
  });
}

export async function getPriceListById(id: number): Promise<PriceListWithMargins | null> {
  await requireAdmin();
  const pl = await prisma.priceList.findUnique({
    where: { id },
    include: {
      margins: {
        include: { productGroup: true },
        orderBy: { productGroup: { displayOrder: "asc" } },
      },
    },
  });
  if (!pl) return null;
  return {
    ...pl,
    margins: pl.margins.map(
      (m): MarginMatrixEntry => ({
        id: m.id,
        priceListId: m.priceListId,
        productGroupId: m.productGroupId,
        productGroupName: m.productGroup.name,
        marginPercent: Number(m.marginPercent), // coerce Prisma Decimal to number
      })
    ),
  };
}

export async function createPriceList(data: CreatePriceListInput): Promise<{ id: number }> {
  await requireAdmin();
  return prisma.priceList.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder ?? 0,
    },
    select: { id: true },
  });
}

export async function updatePriceList(id: number, data: UpdatePriceListInput): Promise<void> {
  await requireAdmin();
  await prisma.priceList.update({ where: { id }, data });
}

export async function deletePriceList(id: number): Promise<void> {
  await requireAdmin();
  // Hard delete is fine — no FK references outside price_list_margins (cascade) and users (SET NULL)
  await prisma.priceList.delete({ where: { id } });
}

// ─── Margin Matrix ────────────────────────────────────────────────────────────

export async function batchUpsertMargins(
  priceListId: number,
  entries: { productGroupId: number; marginPercent: number }[]
): Promise<void> {
  await requireAdmin();
  await prisma.$transaction(
    entries.map((entry) =>
      prisma.priceListMargin.upsert({
        where: {
          // Prisma generates compound unique name from @@unique([priceListId, productGroupId])
          priceListId_productGroupId: {
            priceListId,
            productGroupId: entry.productGroupId,
          },
        },
        update: { marginPercent: entry.marginPercent },
        create: {
          priceListId,
          productGroupId: entry.productGroupId,
          marginPercent: entry.marginPercent,
        },
      })
    )
  );
}

// ─── Clone ────────────────────────────────────────────────────────────────────

export async function clonePriceList(
  sourceId: number,
  newCode: string,
  newName: string
): Promise<{ id: number }> {
  await requireAdmin();
  return prisma.$transaction(async (tx) => {
    const source = await tx.priceList.findUniqueOrThrow({
      where: { id: sourceId },
      include: { margins: true },
    });
    const cloned = await tx.priceList.create({
      data: {
        code: newCode,
        name: newName,
        description: source.description,
        displayOrder: source.displayOrder + 1,
      },
    });
    if (source.margins.length > 0) {
      await tx.priceListMargin.createMany({
        data: source.margins.map((m) => ({
          priceListId: cloned.id,
          productGroupId: m.productGroupId,
          marginPercent: m.marginPercent,
        })),
      });
    }
    return { id: cloned.id };
  });
}

// ─── User price list ──────────────────────────────────────────────────────────

export async function getUserPriceList(userId: number): Promise<PriceListWithMargins | null> {
  await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      priceList: {
        include: {
          margins: {
            include: { productGroup: true },
            orderBy: { productGroup: { displayOrder: "asc" } },
          },
        },
      },
    },
  });
  if (!user?.priceList) return null;
  const pl = user.priceList;
  return {
    ...pl,
    margins: pl.margins.map(
      (m): MarginMatrixEntry => ({
        id: m.id,
        priceListId: m.priceListId,
        productGroupId: m.productGroupId,
        productGroupName: m.productGroup.name,
        marginPercent: Number(m.marginPercent),
      })
    ),
  };
}
