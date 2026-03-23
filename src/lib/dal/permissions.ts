import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./auth";
import { logActivity } from "./activity-log";
import { sidebarItems } from "@/lib/navigation";

export async function getAvailablePages(): Promise<string[]> {
  await requireAdmin();

  return sidebarItems
    .filter((item) => item.type === "item")
    .map((item) => (item as { type: "item"; pageId: string }).pageId);
}

export async function getUserPermissions(userId: number) {
  await requireAdmin();

  const pages = await getAvailablePages();
  const existing = await prisma.userPermission.findMany({
    where: { userId },
    select: {
      pageId: true,
      canAccess: true,
      canSee: true,
    },
  });

  const permMap = new Map(existing.map((p) => [p.pageId, p]));

  return pages.map((pageId) => ({
    pageId,
    canAccess: permMap.get(pageId)?.canAccess ?? false,
    canSee: permMap.get(pageId)?.canSee ?? true,
  }));
}

export async function updateUserPermissions(
  userId: number,
  permissions: Array<{ pageId: string; canAccess: boolean; canSee: boolean }>
) {
  const admin = await requireAdmin();

  // Get existing permissions for comparison
  const existing = await prisma.userPermission.findMany({
    where: { userId },
    select: { pageId: true, canAccess: true, canSee: true },
  });
  const existingMap = new Map(existing.map((p) => [p.pageId, p]));

  // Upsert all permissions
  for (const perm of permissions) {
    await prisma.userPermission.upsert({
      where: { userId_pageId: { userId, pageId: perm.pageId } },
      create: {
        userId,
        pageId: perm.pageId,
        canAccess: perm.canAccess,
        canSee: perm.canSee,
        grantedBy: admin.id,
      },
      update: {
        canAccess: perm.canAccess,
        canSee: perm.canSee,
        grantedBy: admin.id,
      },
    });

    const prev = existingMap.get(perm.pageId);
    const accessChanged = prev ? prev.canAccess !== perm.canAccess : perm.canAccess;
    const seeChanged = prev ? prev.canSee !== perm.canSee : !perm.canSee;

    if (accessChanged || seeChanged) {
      const action = perm.canAccess ? "granted" : "revoked";

      // Create history entry
      await prisma.userPermissionsHistory.create({
        data: {
          userId,
          pageId: perm.pageId,
          canAccess: perm.canAccess,
          canSee: perm.canSee,
          changedBy: admin.id,
          changedByEmail: admin.email,
          action,
        },
      });

      await logActivity({
        activityType: "user",
        action: "update",
        description: `Admin ${admin.email} ${action === "granted" ? "przyznał" : "odebrał"} uprawnienia do ${perm.pageId} dla użytkownika ID ${userId}`,
        entityType: "user_permission",
        entityId: userId,
        entityName: perm.pageId,
      }).catch(() => {});
    }
  }
}

export async function bulkSetPermissions(
  userId: number,
  pageIds: string[],
  canAccess: boolean,
  canSee: boolean
) {
  await updateUserPermissions(
    userId,
    pageIds.map((pageId) => ({ pageId, canAccess, canSee }))
  );
}
