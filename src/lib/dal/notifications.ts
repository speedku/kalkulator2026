import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  const userId = parseInt(session.user.id);

  const total = await prisma.notification.count({
    where: {
      AND: [
        {
          OR: [
            { targetType: "all" },
            { recipients: { some: { userId } } },
          ],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        {
          reads: { none: { userId, isDismissed: false } },
        },
      ],
    },
  });
  return total;
}

export async function getNotifications(take = 20) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = parseInt(session.user.id);

  return prisma.notification.findMany({
    where: {
      AND: [
        {
          OR: [
            { targetType: "all" },
            { recipients: { some: { userId } } },
          ],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      ],
    },
    include: {
      reads: { where: { userId } },
      sender: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markNotificationRead(notificationId: number) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = parseInt(session.user.id);

  await prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId, userId } },
    create: { notificationId, userId },
    update: { readAt: new Date() },
  });
}

export async function createNotification(params: {
  senderId: number;
  title: string;
  message: string;
  type?: string;
  targetType?: string;
  priority?: string;
  expiresAt?: Date;
  recipientUserIds?: number[];
}) {
  const notification = await prisma.notification.create({
    data: {
      senderId: params.senderId,
      title: params.title,
      message: params.message,
      type: params.type ?? "system",
      targetType: params.targetType ?? "all",
      priority: params.priority ?? "normal",
      expiresAt: params.expiresAt,
    },
  });

  if (
    params.targetType === "specific" &&
    params.recipientUserIds &&
    params.recipientUserIds.length > 0
  ) {
    await prisma.notificationRecipient.createMany({
      data: params.recipientUserIds.map((userId) => ({
        notificationId: notification.id,
        userId,
      })),
    });
  }

  return notification;
}
