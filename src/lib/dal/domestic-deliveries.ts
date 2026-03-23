import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/dal/auth";
import type {
  DomesticDeliveryRow,
  DomesticDeliveryWithDocuments,
  CalendarEvent,
} from "@/types/domestic-deliveries";
import type { DomesticDeliveryInput } from "@/lib/validations/domestic-deliveries";

export async function getDomesticDeliveries(): Promise<DomesticDeliveryRow[]> {
  await requireAdmin();
  const rows = await prisma.domesticDelivery.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      supplier: true,
      etaDate: true,
      actualArrivalDate: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { etaDate: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    supplier: r.supplier,
    etaDate: r.etaDate,
    actualArrivalDate: r.actualArrivalDate,
    status: r.status as DomesticDeliveryRow["status"],
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getDomesticDeliveryById(
  id: number
): Promise<DomesticDeliveryWithDocuments | null> {
  await requireAdmin();
  const row = await prisma.domesticDelivery.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    supplier: row.supplier,
    etaDate: row.etaDate,
    actualArrivalDate: row.actualArrivalDate,
    status: row.status as DomesticDeliveryRow["status"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    documents: row.documents.map((doc) => ({
      id: doc.id,
      deliveryId: doc.deliveryId,
      documentType: doc.documentType as DomesticDeliveryWithDocuments["documents"][number]["documentType"],
      originalFilename: doc.originalFilename,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
    })),
  };
}

export async function createDomesticDelivery(
  data: DomesticDeliveryInput,
  userId: number
): Promise<DomesticDeliveryRow> {
  await requireAdmin();
  const row = await prisma.domesticDelivery.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      supplier: data.supplier,
      etaDate: data.etaDate,
      actualArrivalDate: data.actualArrivalDate ?? null,
      status: data.status ?? "pending",
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    },
  });
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    supplier: row.supplier,
    etaDate: row.etaDate,
    actualArrivalDate: row.actualArrivalDate,
    status: row.status as DomesticDeliveryRow["status"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateDomesticDeliveryStatus(
  id: number,
  status: string,
  actualArrivalDate?: Date | null,
  userId?: number
): Promise<DomesticDeliveryRow> {
  await requireAdmin();
  const row = await prisma.domesticDelivery.update({
    where: { id },
    data: {
      status,
      ...(actualArrivalDate !== undefined ? { actualArrivalDate } : {}),
      ...(userId !== undefined ? { updatedBy: userId } : {}),
      updatedAt: new Date(),
    },
  });
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    supplier: row.supplier,
    etaDate: row.etaDate,
    actualArrivalDate: row.actualArrivalDate,
    status: row.status as DomesticDeliveryRow["status"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getCalendarDeliveries(
  year: number,
  month: number
): Promise<{ containers: CalendarEvent[]; domesticDeliveries: CalendarEvent[] }> {
  await requireAuth();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const [containerRows, deliveryRows] = await Promise.all([
    prisma.container.findMany({
      where: {
        etaDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: {
        id: true,
        containerNumber: true,
        etaDate: true,
        status: true,
        carrier: true,
      },
      orderBy: { etaDate: "asc" },
    }),
    prisma.domesticDelivery.findMany({
      where: {
        etaDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: {
        id: true,
        name: true,
        etaDate: true,
        status: true,
        supplier: true,
      },
      orderBy: { etaDate: "asc" },
    }),
  ]);

  const containers: CalendarEvent[] = containerRows.map((c) => ({
    id: c.id,
    type: "container",
    label: c.containerNumber,
    etaDate: c.etaDate,
    status: c.status,
    detail: c.carrier,
    href: `/containers/${c.id}`,
  }));

  const domesticDeliveries: CalendarEvent[] = deliveryRows.map((d) => ({
    id: d.id,
    type: "domestic",
    label: d.name,
    etaDate: d.etaDate,
    status: d.status,
    detail: d.supplier,
    href: `/deliveries/${d.id}`,
  }));

  return { containers, domesticDeliveries };
}
