"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createInvoice, deleteInvoice } from "@/lib/dal/invoices";
import { createInvoiceSchema } from "@/lib/validations/invoices";

type ActionState = { error?: string; success?: string };

export async function createInvoiceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { invoiceId?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = createInvoiceSchema.safeParse({
    ...raw,
    vatRate: Number(raw.vatRate ?? 23),
    items: JSON.parse((raw.items as string) ?? "[]"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };

  try {
    const result = await createInvoice({
      ...parsed.data,
      userId: Number(session.user.id),
    });
    revalidatePath("/invoices");
    return { success: `Faktura ${result.invoiceNumber} utworzona`, invoiceId: result.id };
  } catch {
    return { error: "Błąd tworzenia faktury" };
  }
}

export async function deleteInvoiceAction(id: number): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };
  try {
    await deleteInvoice(id);
    revalidatePath("/invoices");
    return { success: "Faktura usunięta" };
  } catch {
    return { error: "Błąd usuwania faktury" };
  }
}
