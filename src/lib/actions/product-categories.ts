"use server";

import { revalidatePath } from "next/cache";
import { createCategory, createProductGroup } from "@/lib/dal/product-categories";
import { requireAdmin } from "@/lib/dal/auth";

export type CategoryActionState = { error?: string; success?: string };

export async function createCategoryAction(
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name || !slug) return { error: "Nazwa i slug są wymagane" };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug może zawierać tylko małe litery, cyfry i myślniki" };
  }
  try {
    await createCategory(name, slug);
    revalidatePath("/products/categories");
    return { success: "Kategoria została dodana" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd podczas tworzenia kategorii" };
  }
}

export async function createProductGroupAction(
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nazwa jest wymagana" };
  try {
    await createProductGroup(name);
    revalidatePath("/products/categories");
    return { success: "Grupa produktów została dodana" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd podczas tworzenia grupy" };
  }
}
