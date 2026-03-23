import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/dal/auth";
import type { QuotationRow, QuotationWithItems } from "@/types/quotations";
import type { CreateQuotationInput } from "@/lib/validations/quotations";

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getQuotations(filters?: {
  status?: string;
  customerName?: string;
  from?: Date;
  to?: Date;
}): Promise<QuotationRow[]> {
  await requireAuth();
  const rows = await prisma.quotation.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.customerName
        ? { customerName: { contains: filters.customerName } }
        : {}),
      ...(filters?.from || filters?.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      quotationNumber: true,
      customerName: true,
      customerEmail: true,
      priceListId: true,
      status: true,
      totalAmount: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    ...r,
    totalAmount: Number(r.totalAmount),
    creatorName: r.creator?.name ?? null,
  }));
}

export async function getQuotationById(id: number): Promise<QuotationWithItems | null> {
  await requireAuth();
  const row = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      priceList: { select: { name: true } },
      creator: { select: { name: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    quotationNumber: row.quotationNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    priceListId: row.priceListId,
    status: row.status,
    totalAmount: Number(row.totalAmount),
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creatorName: row.creator?.name ?? null,
    priceListName: row.priceList?.name ?? null,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createQuotation(
  data: CreateQuotationInput & { userId: number }
): Promise<{ id: number; quotationNumber: string }> {
  await requireAuth();
  return prisma.$transaction(async (tx) => {
    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    // Step 1: INSERT with placeholder (AUTO_INCREMENT assigns id atomically)
    const quotation = await tx.quotation.create({
      data: {
        quotationNumber: "PENDING",
        customerName: data.customerName,
        customerEmail: data.customerEmail ?? null,
        priceListId: data.priceListId ?? null,
        totalAmount,
        notes: data.notes ?? null,
        createdBy: data.userId,
        status: "draft",
      },
      select: { id: true },
    });
    // Step 2: Compute WYC number from AUTO_INCREMENT id (collision-free)
    const year = new Date().getFullYear();
    const quotationNumber = `WYC-${year}-${String(quotation.id).padStart(5, "0")}`;
    // Step 3: UPDATE to real number
    await tx.quotation.update({
      where: { id: quotation.id },
      data: { quotationNumber },
    });
    // Step 4: Insert items (server recomputes totalPrice — never trust client values for storage)
    await tx.quotationItem.createMany({
      data: data.items.map((item) => ({
        quotationId: quotation.id,
        productId: item.productId ?? null,
        productName: item.productName,
        sku: item.sku ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice, // server-side recompute
      })),
    });
    return { id: quotation.id, quotationNumber };
  });
}

export async function duplicateQuotation(
  sourceId: number,
  userId: number
): Promise<{ id: number; quotationNumber: string }> {
  await requireAuth();
  const source = await getQuotationById(sourceId);
  if (!source) throw new Error("Wycena nie istnieje");
  return createQuotation({
    customerName: source.customerName,
    customerEmail: source.customerEmail ?? null,
    priceListId: source.priceListId ?? null,
    notes: source.notes ?? null,
    items: source.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    userId,
  });
}

export async function updateQuotationStatus(
  id: number,
  status: string
): Promise<void> {
  await requireAuth();
  await prisma.quotation.update({ where: { id }, data: { status } });
}

export async function deleteQuotation(id: number): Promise<void> {
  await requireAuth();
  await prisma.quotation.delete({ where: { id } });
}
