"use server";

import { revalidatePath } from "next/cache";
import {
  createAccessCodeSchema,
  updateAccessCodeSchema,
} from "@/lib/validations/access-codes";
import {
  createAccessCode,
  updateAccessCode,
  deleteAccessCode,
} from "@/lib/dal/access-codes";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createAccessCodeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    maxUses: formData.get("maxUses") ? Number(formData.get("maxUses")) : 1,
    expiresAt: formData.get("expiresAt") ? formData.get("expiresAt") : undefined,
  };

  const parsed = createAccessCodeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Nieprawidłowe dane",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await createAccessCode(parsed.data);
    revalidatePath("/settings/access-codes");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    if (message.includes("Unique constraint") || message.includes("unique")) {
      return { error: "Kod dostępu o tej nazwie już istnieje" };
    }
    return { error: message };
  }
}

export async function updateAccessCodeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) return { error: "Nieprawidłowe ID kodu dostępu" };

  const raw: {
    isActive?: boolean;
    description?: string;
    maxUses?: number;
    expiresAt?: string | null;
  } = {};

  const isActive = formData.get("isActive");
  if (isActive !== null) raw.isActive = isActive === "true";

  const description = formData.get("description");
  if (description !== null) raw.description = description as string;

  const maxUses = formData.get("maxUses");
  if (maxUses !== null) raw.maxUses = Number(maxUses);

  const expiresAt = formData.get("expiresAt");
  if (expiresAt !== null) raw.expiresAt = expiresAt as string;

  const parsed = updateAccessCodeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Nieprawidłowe dane",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateAccessCode(id, parsed.data);
    revalidatePath("/settings/access-codes");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd",
    };
  }
}

export async function deleteAccessCodeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) return { error: "Nieprawidłowe ID kodu dostępu" };

  try {
    await deleteAccessCode(id);
    revalidatePath("/settings/access-codes");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd",
    };
  }
}
