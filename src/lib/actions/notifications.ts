"use server";

import { markNotificationRead } from "@/lib/dal/notifications";
import { requireAuth } from "@/lib/dal/auth";

export async function markNotificationReadAction(notificationId: number) {
  await requireAuth();
  await markNotificationRead(notificationId);
}
