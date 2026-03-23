"use server";

import { revalidatePath } from "next/cache";
import { updatePermissionsSchema } from "@/lib/validations/permissions";
import { updateUserPermissions } from "@/lib/dal/permissions";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updatePermissionsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = Number(formData.get("userId"));
  const permissionsJson = formData.get("permissions");

  if (!userId || isNaN(userId)) return { error: "Nieprawidłowe ID użytkownika" };
  if (!permissionsJson || typeof permissionsJson !== "string") {
    return { error: "Brak danych uprawnień" };
  }

  let permissionsData: unknown;
  try {
    permissionsData = JSON.parse(permissionsJson);
  } catch {
    return { error: "Nieprawidłowy format danych uprawnień" };
  }

  const parsed = updatePermissionsSchema.safeParse({
    userId,
    permissions: permissionsData,
  });

  if (!parsed.success) {
    return {
      error: "Nieprawidłowe dane uprawnień",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateUserPermissions(parsed.data.userId, parsed.data.permissions);
    revalidatePath("/settings/permissions");
    revalidatePath(`/settings/users/${userId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd",
    };
  }
}
