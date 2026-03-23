"use server";

import { revalidatePath } from "next/cache";
import { createUserSchema, updateUserSchema } from "@/lib/validations/users";
import { createUser, updateUser, toggleUserActive } from "@/lib/dal/users";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Nieprawidłowe dane",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await createUser(parsed.data);
    revalidatePath("/settings/users");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    if (message.includes("Unique constraint") || message.includes("unique")) {
      return { error: "Użytkownik z tym adresem email już istnieje" };
    }
    return { error: message };
  }
}

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) return { error: "Nieprawidłowe ID użytkownika" };

  const raw = {
    name: formData.get("name") ?? undefined,
    email: formData.get("email") ?? undefined,
    role: formData.get("role") ?? undefined,
    isActive:
      formData.get("isActive") !== null
        ? formData.get("isActive") === "true"
        : undefined,
  };

  // Remove undefined values
  const cleanRaw = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  const parsed = updateUserSchema.safeParse(cleanRaw);
  if (!parsed.success) {
    return {
      error: "Nieprawidłowe dane",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateUser(id, parsed.data);
    revalidatePath("/settings/users");
    revalidatePath(`/settings/users/${id}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd",
    };
  }
}

export async function toggleUserActiveAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) return { error: "Nieprawidłowe ID użytkownika" };

  try {
    await toggleUserActive(id);
    revalidatePath("/settings/users");
    revalidatePath(`/settings/users/${id}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd",
    };
  }
}
