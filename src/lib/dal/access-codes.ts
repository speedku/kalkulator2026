import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./auth";
import { logActivity } from "./activity-log";

export interface GetAccessCodesParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export async function getAccessCodes(params: GetAccessCodesParams = {}) {
  await requireAdmin();

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: { code?: { contains: string } } = {};
  if (params.search) {
    where.code = { contains: params.search };
  }

  const [codes, total] = await Promise.all([
    prisma.accessCode.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        description: true,
        isActive: true,
        maxUses: true,
        currentUses: true,
        expiresAt: true,
        createdAt: true,
        createdBy: true,
      },
    }),
    prisma.accessCode.count({ where }),
  ]);

  return { codes, total, page, perPage };
}

export async function getAccessCodeById(id: number) {
  await requireAdmin();

  return prisma.accessCode.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function createAccessCode(data: {
  code: string;
  description?: string;
  maxUses: number;
  expiresAt?: Date | null;
}) {
  const admin = await requireAdmin();

  const accessCode = await prisma.accessCode.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt ?? null,
      createdBy: admin.id,
    },
  });

  await logActivity({
    activityType: "system",
    action: "create",
    description: `Admin ${admin.email} utworzył kod dostępu ${accessCode.code}`,
    entityType: "access_code",
    entityId: accessCode.id,
    entityName: accessCode.code,
  }).catch(() => {});

  return accessCode;
}

export async function updateAccessCode(
  id: number,
  data: {
    isActive?: boolean;
    description?: string;
    maxUses?: number;
    expiresAt?: Date | null;
  }
) {
  const admin = await requireAdmin();

  const accessCode = await prisma.accessCode.update({
    where: { id },
    data,
  });

  await logActivity({
    activityType: "system",
    action: "update",
    description: `Admin ${admin.email} zaktualizował kod dostępu ${accessCode.code}`,
    entityType: "access_code",
    entityId: accessCode.id,
    entityName: accessCode.code,
    metadata: data as Record<string, unknown>,
  }).catch(() => {});

  return accessCode;
}

export async function deleteAccessCode(id: number) {
  const admin = await requireAdmin();

  const accessCode = await prisma.accessCode.update({
    where: { id },
    data: { isActive: false },
  });

  await logActivity({
    activityType: "system",
    action: "delete",
    description: `Admin ${admin.email} dezaktywował kod dostępu ${accessCode.code}`,
    entityType: "access_code",
    entityId: accessCode.id,
    entityName: accessCode.code,
  }).catch(() => {});

  return accessCode;
}
