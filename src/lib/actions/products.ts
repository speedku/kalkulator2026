"use server";

import { revalidatePath } from "next/cache";
import {
  createProductSchema,
  updateProductSchema,
  bulkDeleteSchema,
} from "@/lib/validations/products";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
} from "@/lib/dal/products";

export type ActionState = { error?: string; success?: string };

export async function createProductAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku") || undefined,
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId")
      ? Number(formData.get("categoryId"))
      : undefined,
    productGroupId: formData.get("productGroupId")
      ? Number(formData.get("productGroupId"))
      : undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    paperType: formData.get("paperType") || undefined,
    grammage: formData.get("grammage") ? Number(formData.get("grammage")) : undefined,
    boxQuantity: formData.get("boxQuantity")
      ? Number(formData.get("boxQuantity"))
      : undefined,
    palletQuantity: formData.get("palletQuantity")
      ? Number(formData.get("palletQuantity"))
      : undefined,
    boxDimensions: formData.get("boxDimensions") || undefined,
    boxWeight: formData.get("boxWeight") ? Number(formData.get("boxWeight")) : undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") !== "false",
    displayOrder: Number(formData.get("displayOrder") ?? 0),
  };
  const result = createProductSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    await createProduct(result.data);
    revalidatePath("/products");
    return { success: "Produkt został utworzony" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd podczas tworzenia produktu" };
  }
}

export async function updateProductAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const raw = {
    id,
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku") || undefined,
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId")
      ? Number(formData.get("categoryId"))
      : undefined,
    productGroupId: formData.get("productGroupId")
      ? Number(formData.get("productGroupId"))
      : undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") !== "false",
  };
  const result = updateProductSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    const { id: productId, ...data } = result.data;
    await updateProduct(productId, data);
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: "Produkt został zaktualizowany" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Błąd podczas aktualizacji produktu",
    };
  }
}

export async function deleteProductAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  if (!id) return { error: "Nieprawidłowe ID produktu" };
  try {
    await deleteProduct(id);
    revalidatePath("/products");
    return { success: "Produkt został usunięty" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Błąd podczas usuwania produktu" };
  }
}

export async function bulkDeleteProductsAction(ids: number[]): Promise<ActionState> {
  const result = bulkDeleteSchema.safeParse({ ids });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  try {
    const res = await bulkDeleteProducts(result.data.ids);
    revalidatePath("/products");
    return { success: `Usunięto ${res.count} produktów` };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Błąd podczas masowego usuwania",
    };
  }
}
