import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "./auth";

// Matches the existing activity_log table enum structure
type ActivityType =
  | "product"
  | "container"
  | "sync"
  | "delivery"
  | "auth"
  | "system"
  | "quotation"
  | "user";

type Action =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "complete"
  | "error"
  | "view"
  | "export"
  | "import";

export interface LogActivityParams {
  activityType: ActivityType;
  action: Action;
  description: string;
  entityType?: string;
  entityId?: number;
  entityName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity entry to the activity_log table.
 * Automatically resolves the current user ID from session.
 * Can be called without an authenticated user (userId will be null).
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const user = await getCurrentUser();

  await prisma.activityLog.create({
    data: {
      userId: user?.id ?? null,
      activityType: params.activityType,
      action: params.action,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export interface GetActivityLogParams {
  activityType?: string;
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  perPage?: number;
}

export interface ActivityLogEntry {
  id: number;
  userId: number | null;
  activityType: string;
  action: string;
  description: string;
  entityType: string | null;
  entityId: number | null;
  entityName: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: { id: number; name: string | null; email: string } | null;
}

export interface GetActivityLogResult {
  entries: ActivityLogEntry[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Get paginated activity log entries with filtering.
 * Requires admin role.
 */
export async function getActivityLog(
  params: GetActivityLogParams = {}
): Promise<GetActivityLogResult> {
  await requireAdmin();

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 50;
  const skip = (page - 1) * perPage;

  const where: {
    activityType?: string;
    userId?: number;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (params.activityType) {
    where.activityType = params.activityType;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = params.dateFrom;
    if (params.dateTo) where.createdAt.lte = params.dateTo;
  }

  const [entries, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { entries, total, page, perPage };
}
