"use server";

import { revalidatePath } from "next/cache";
import {
  createPriceListSchema,
  updatePriceListSchema,
  batchMarginsSchema,
  assignPriceListSchema,
  clonePriceListSchema,
} from "@/lib/validations/price-lists";
import {
  createPriceList,
  updatePriceList,
  deletePriceList,
  batchUpsertMargins,
  clonePriceList,
} from "@/lib/dal/price-lists";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";

export type ActionState = { error?: string; success?: string };

export async function createPriceListAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    displayOrder: formData.get("displayOrder"),
  };
  const result = createPriceListSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    await createPriceList(result.data);
    revalidatePath("/price-lists");
    return { success: "Cennik został utworzony" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd podczas tworzenia cennika" };
  }
}

export async function updatePriceListAction(
  id: number,
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    displayOrder: formData.get("displayOrder"),
    isActive: formData.get("isActive") === "true",
  };
  const result = updatePriceListSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    await updatePriceList(id, result.data);
    revalidatePath("/price-lists");
    revalidatePath(`/price-lists/${id}`);
    return { success: "Cennik zaktualizowany" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd aktualizacji cennika" };
  }
}

export async function deletePriceListAction(id: number): Promise<ActionState> {
  try {
    await deletePriceList(id);
    revalidatePath("/price-lists");
    return { success: "Cennik usunięty" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd usunięcia cennika" };
  }
}

export async function batchUpsertMarginsAction(rawData: unknown): Promise<ActionState> {
  const result = batchMarginsSchema.safeParse(rawData);
  if (!result.success)
    return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane marż" };
  try {
    const { priceListId, margins } = result.data;
    await batchUpsertMargins(priceListId, margins);
    revalidatePath(`/price-lists/${priceListId}`);
    return { success: `Zapisano ${margins.length} marż` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd zapisu marż" };
  }
}

export async function clonePriceListAction(
  rawData: unknown
): Promise<ActionState & { newId?: number }> {
  const result = clonePriceListSchema.safeParse(rawData);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    const cloned = await clonePriceList(result.data.sourceId, result.data.newCode, result.data.newName);
    revalidatePath("/price-lists");
    return { success: "Cennik sklonowany", newId: cloned.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd klonowania cennika" };
  }
}

export async function assignPriceListAction(rawData: unknown): Promise<ActionState> {
  await requireAdmin();
  const result = assignPriceListSchema.safeParse(rawData);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    await prisma.user.update({
      where: { id: result.data.userId },
      data: { priceListId: result.data.priceListId },
    });
    revalidatePath("/admin/users");
    return { success: "Cennik przypisany do użytkownika" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd przypisania cennika" };
  }
}
