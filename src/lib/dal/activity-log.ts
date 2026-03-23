import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";

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
