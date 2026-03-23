"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/dal/auth";
import { auth } from "@/auth";
import bcryptjs from "bcryptjs";
import { z } from "zod";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Podaj aktualne hasło"),
    newPassword: z.string().min(8, "Nowe hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

type ActionState = { error?: string; success?: string };

export async function changePasswordAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const session = await auth();
  if (!session?.user?.id) return { error: "Nie jesteś zalogowany" };

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Użytkownik nie istnieje" };

  const isValid = await bcryptjs.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!isValid) return { error: "Aktualne hasło jest nieprawidłowe" };

  const newHash = await bcryptjs.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: parseInt(session.user.id) },
    data: { passwordHash: newHash },
  });

  return { success: "Hasło zostało zmienione" };
}
