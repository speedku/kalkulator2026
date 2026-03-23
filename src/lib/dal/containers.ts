import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";
import type {
  ContainerRow,
  ContainerWithItems,
  ContainerAnalytics,
} from "@/types/containers";
import type {
  ContainerInput,
  ContainerItemInput,
  ContainerDocumentInput,
} from "@/lib/validations/containers";

export async function getContainers(): Promise<ContainerRow[]> {
  await requireAdmin();
  const rows = await prisma.container.findMany({
    select: {
      id: true,
      containerNumber: true,
      carrier: true,
      portOfOrigin: true,
      portOfDestination: true,
      shipmentDate: true,
      etaDate: true,
      actualArrivalDate: true,
      status: true,
      totalValue: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { etaDate: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    containerNumber: r.containerNumber,
    carrier: r.carrier,
    portOfOrigin: r.portOfOrigin,
    portOfDestination: r.portOfDestination,
    shipmentDate: r.shipmentDate,
    etaDate: r.etaDate,
    actualArrivalDate: r.actualArrivalDate,
    status: r.status as ContainerRow["status"],
    totalValue: r.totalValue !== null ? Number(r.totalValue) : null,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getContainerById(id: number): Promise<ContainerWithItems | null> {
  await requireAdmin();
  const row = await prisma.container.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              boxQuantity: true,
              boxWeight: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    containerNumber: row.containerNumber,
    carrier: row.carrier,
    portOfOrigin: row.portOfOrigin,
    portOfDestination: row.portOfDestination,
    shipmentDate: row.shipmentDate,
    etaDate: row.etaDate,
    actualArrivalDate: row.actualArrivalDate,
    status: row.status as ContainerRow["status"],
    totalValue: row.totalValue !== null ? Number(row.totalValue) : null,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => ({
      id: item.id,
      containerId: item.containerId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.unitPrice) * item.quantity,
      notes: item.notes,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        boxQuantity: item.product.boxQuantity,
        boxWeight: item.product.boxWeight !== null ? Number(item.product.boxWeight) : null,
      },
    })),
    documents: row.documents.map((doc) => ({
      id: doc.id,
      containerId: doc.containerId,
      documentType: doc.documentType as ContainerWithItems["documents"][number]["documentType"],
      originalFilename: doc.originalFilename,
      storedFilename: doc.storedFilename,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
    })),
  };
}

export async function createContainer(
  data: ContainerInput,
  userId: number
): Promise<ContainerRow> {
  await requireAdmin();
  const row = await prisma.container.create({
    data: {
      containerNumber: data.containerNumber,
      carrier: data.carrier,
      portOfOrigin: data.portOfOrigin,
      portOfDestination: data.portOfDestination,
      shipmentDate: data.shipmentDate,
      etaDate: data.etaDate,
      actualArrivalDate: data.actualArrivalDate ?? null,
      status: data.status ?? "in_transit",
      totalValue: data.totalValue ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    },
  });
  return {
    id: row.id,
    containerNumber: row.containerNumber,
    carrier: row.carrier,
    portOfOrigin: row.portOfOrigin,
    portOfDestination: row.portOfDestination,
    shipmentDate: row.shipmentDate,
    etaDate: row.etaDate,
    actualArrivalDate: row.actualArrivalDate,
    status: row.status as ContainerRow["status"],
    totalValue: row.totalValue !== null ? Number(row.totalValue) : null,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateContainerStatus(
  id: number,
  status: string,
  actualArrivalDate?: Date | null,
  userId?: number
): Promise<ContainerRow> {
  await requireAdmin();
  const row = await prisma.container.update({
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
    containerNumber: row.containerNumber,
    carrier: row.carrier,
    portOfOrigin: row.portOfOrigin,
    portOfDestination: row.portOfDestination,
    shipmentDate: row.shipmentDate,
    etaDate: row.etaDate,
    actualArrivalDate: row.actualArrivalDate,
    status: row.status as ContainerRow["status"],
    totalValue: row.totalValue !== null ? Number(row.totalValue) : null,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function addContainerItem(
  containerId: number,
  data: ContainerItemInput
): Promise<number> {
  await requireAdmin();
  const item = await prisma.containerItem.create({
    data: {
      containerId,
      productId: data.productId,
      variantId: data.variantId ?? null,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      notes: data.notes ?? null,
    },
    select: { id: true },
  });
  return item.id;
}

export async function removeContainerItem(itemId: number): Promise<void> {
  await requireAdmin();
  await prisma.containerItem.delete({ where: { id: itemId } });
}

export async function addContainerDocument(
  containerId: number,
  data: ContainerDocumentInput,
  uploadedBy?: number
): Promise<void> {
  await requireAdmin();
  await prisma.containerDocument.create({
    data: {
      containerId,
      documentType: data.documentType,
      originalFilename: data.originalFilename,
      storedFilename: data.storedFilename,
      filePath: data.filePath,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      uploadedBy: uploadedBy ?? null,
    },
  });
}

export async function getContainerAnalytics(): Promise<ContainerAnalytics> {
  await requireAdmin();

  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [inTransitCount, etaThisWeekCount, aggregates, avgResult] =
    await Promise.all([
      prisma.container.count({ where: { status: "in_transit" } }),
      prisma.container.count({
        where: {
          etaDate: { gte: now, lte: oneWeekLater },
          status: { not: "completed" },
        },
      }),
      prisma.container.aggregate({
        _sum: { totalValue: true },
        _count: { id: true },
        where: { status: "completed" },
      }),
      prisma.$queryRaw<Array<{ avg_days: number | null }>>`
        SELECT AVG(DATEDIFF(actual_arrival_date, shipment_date)) as avg_days
        FROM containers
        WHERE status = 'completed' AND actual_arrival_date IS NOT NULL
      `,
    ]);

  const completedCount = aggregates._count.id;
  const totalValueUsd = aggregates._sum.totalValue !== null
    ? Number(aggregates._sum.totalValue)
    : 0;

  const avgDays = avgResult[0]?.avg_days !== null && avgResult[0]?.avg_days !== undefined
    ? Math.round(Number(avgResult[0].avg_days))
    : 0;

  // on-time: containers completed before or on their ETA
  const onTimeCount = await prisma.container.count({
    where: {
      status: "completed",
      actualArrivalDate: { not: null },
      // actual_arrival_date <= eta_date: use raw condition
    },
  });

  const onTimePct =
    completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : null;

  return {
    inTransitCount,
    etaThisWeekCount,
    totalValueUsd,
    onTimePct,
    avgDays,
    completedCount,
  };
}
