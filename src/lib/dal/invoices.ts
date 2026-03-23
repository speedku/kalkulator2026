import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";
import type { InvoiceRow, InvoiceWithItems } from "@/types/invoices";
import type { CreateInvoiceInput } from "@/lib/validations/invoices";

export async function getInvoices(filters?: {
  status?: string;
  from?: Date;
  to?: Date;
}): Promise<InvoiceRow[]> {
  await requireAdmin();
  const rows = await prisma.invoice.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
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
      invoiceNumber: true,
      customerName: true,
      customerAddress: true,
      customerNip: true,
      notes: true,
      status: true,
      totalNet: true,
      totalVat: true,
      totalGross: true,
      vatRate: true,
      issuedAt: true,
      dueAt: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    customerName: r.customerName,
    customerAddress: r.customerAddress,
    customerNip: r.customerNip,
    notes: r.notes,
    status: r.status,
    totalNet: Number(r.totalNet),
    totalVat: Number(r.totalVat),
    totalGross: Number(r.totalGross),
    vatRate: r.vatRate,
    issuedAt: r.issuedAt,
    dueAt: r.dueAt,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    creatorName: r.creator?.name ?? null,
  }));
}

export async function getInvoiceById(id: number): Promise<InvoiceWithItems | null> {
  await requireAdmin();
  const row = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      creator: { select: { name: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    customerAddress: row.customerAddress,
    customerNip: row.customerNip,
    notes: row.notes,
    status: row.status,
    totalNet: Number(row.totalNet),
    totalVat: Number(row.totalVat),
    totalGross: Number(row.totalGross),
    vatRate: row.vatRate,
    issuedAt: row.issuedAt,
    dueAt: row.dueAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creatorName: row.creator?.name ?? null,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitNet: Number(item.unitNet),
      totalNet: Number(item.totalNet),
    })),
  };
}

export async function createInvoice(
  data: CreateInvoiceInput & { userId: number }
): Promise<{ id: number; invoiceNumber: string }> {
  await requireAdmin();
  return prisma.$transaction(async (tx) => {
    const totalNet = data.items.reduce((sum, item) => sum + item.totalNet, 0);
    const totalVat = Math.round(totalNet * (data.vatRate / 100) * 100) / 100;
    const totalGross = Math.round((totalNet + totalVat) * 100) / 100;
    // Step 1: INSERT with placeholder
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: "PENDING",
        customerName: data.customerName,
        customerAddress: data.customerAddress ?? null,
        customerNip: data.customerNip ?? null,
        status: "draft",
        totalNet,
        totalVat,
        totalGross,
        vatRate: data.vatRate,
        notes: data.notes ?? null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        createdBy: data.userId,
      },
      select: { id: true },
    });
    // Step 2: FAK number from AUTO_INCREMENT id
    const year = new Date().getFullYear();
    const invoiceNumber = `FAK-${year}-${String(invoice.id).padStart(5, "0")}`;
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { invoiceNumber },
    });
    // Step 3: Insert items
    await tx.invoiceItem.createMany({
      data: data.items.map((item) => ({
        invoiceId: invoice.id,
        productId: item.productId ?? null,
        productName: item.productName,
        sku: item.sku ?? null,
        quantity: item.quantity,
        unitNet: item.unitNet,
        totalNet: item.quantity * item.unitNet,
      })),
    });
    return { id: invoice.id, invoiceNumber };
  });
}

export async function deleteInvoice(id: number): Promise<void> {
  await requireAdmin();
  await prisma.invoice.delete({ where: { id } });
}
