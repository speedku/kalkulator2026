"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createQuotation,
  duplicateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  getQuotationById,
} from "@/lib/dal/quotations";
import { createQuotationSchema, sendEmailSchema } from "@/lib/validations/quotations";
import { sendQuotationEmail } from "@/lib/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPdfTemplate } from "@/lib/pdf/quotation-template";

type ActionState = { error?: string; success?: string };

export async function createQuotationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { quotationId?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = createQuotationSchema.safeParse({
    ...raw,
    items: JSON.parse((raw.items as string) ?? "[]"),
    priceListId: raw.priceListId ? Number(raw.priceListId) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };

  try {
    const result = await createQuotation({
      ...parsed.data,
      userId: Number(session.user.id),
    });
    revalidatePath("/quotations");
    return { success: `Wycena ${result.quotationNumber} utworzona`, quotationId: result.id };
  } catch {
    return { error: "Błąd tworzenia wyceny" };
  }
}

export async function duplicateQuotationAction(
  quotationId: number
): Promise<ActionState & { newId?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };
  try {
    const result = await duplicateQuotation(quotationId, Number(session.user.id));
    revalidatePath("/quotations");
    return { success: `Zduplikowano jako ${result.quotationNumber}`, newId: result.id };
  } catch {
    return { error: "Błąd duplikowania wyceny" };
  }
}

export async function sendQuotationEmailAction(
  quotationId: number,
  recipientEmail: string
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const emailParsed = sendEmailSchema.safeParse({ recipientEmail });
  if (!emailParsed.success) return { error: "Nieprawidłowy adres email" };

  try {
    const quotation = await getQuotationById(quotationId);
    if (!quotation) return { error: "Wycena nie istnieje" };

    const pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      QuotationPdfTemplate({ quotation }) as any
    );

    await sendQuotationEmail({
      to: recipientEmail,
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      pdfBuffer: Buffer.from(pdfBuffer),
      pdfFilename: `Wycena_${quotation.quotationNumber}.pdf`,
    });

    await updateQuotationStatus(quotationId, "sent");
    revalidatePath(`/quotations/${quotationId}`);
    return { success: "Wycena wysłana emailem" };
  } catch {
    return { error: "Błąd wysyłania emaila" };
  }
}

export async function deleteQuotationAction(id: number): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };
  try {
    await deleteQuotation(id);
    revalidatePath("/quotations");
    return { success: "Wycena usunięta" };
  } catch {
    return { error: "Błąd usuwania wyceny" };
  }
}
