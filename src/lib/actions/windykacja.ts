"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createWindykacjaCase,
  updateCaseStatus,
  logReminder,
  getWindykacjaCase,
} from "@/lib/dal/windykacja";
import { SendReminderSchema } from "@/lib/validations/windykacja";
import { sendPaymentReminderEmail } from "@/lib/email";
import { differenceInDays } from "date-fns";

type ActionState = { error?: string; success?: string };

export async function createWindykacjaCaseAction(
  invoiceId: number
): Promise<ActionState> {
  try {
    await createWindykacjaCase({ invoiceId });
    revalidatePath("/windykacja");
    return { success: "Sprawa windykacyjna utworzona" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    // Handle unique constraint — case already exists for this invoice
    if (message.includes("Unique constraint")) {
      return { error: "Sprawa dla tej faktury już istnieje" };
    }
    return { error: "Nie udało się utworzyć sprawy" };
  }
}

export async function updateCaseStatusAction(
  id: number,
  status: string
): Promise<ActionState> {
  try {
    const resolvedAt =
      status === "settled" || status === "written_off" ? new Date() : undefined;
    await updateCaseStatus(id, status, resolvedAt);
    revalidatePath("/windykacja");
    return { success: "Status sprawy zaktualizowany" };
  } catch {
    return { error: "Nie udało się zaktualizować statusu" };
  }
}

export async function sendReminderAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const sentBy = session?.user?.id ? Number(session.user.id) : undefined;

  const raw = Object.fromEntries(formData.entries());
  const parsed = SendReminderSchema.safeParse({
    ...raw,
    caseId: Number(raw.caseId),
    level: Number(raw.level),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  const { caseId, recipientEmail, level } = parsed.data;

  // Get case with invoice data for email content
  const caseData = await getWindykacjaCase(caseId);
  if (!caseData) {
    return { error: "Sprawa nie istnieje" };
  }

  const invoice = caseData.invoice;
  const daysOverdue = invoice.dueAt
    ? differenceInDays(new Date(), invoice.dueAt)
    : 0;

  const levelLabels = [
    "",
    "Pierwsze przypomnienie",
    "Drugie przypomnienie",
    "Pilne przypomnienie",
    "Ostateczne wezwanie",
  ];
  const subject = `${levelLabels[level]} — ${invoice.invoiceNumber} — ALLBAG`;

  let emailStatus: "sent" | "failed" = "sent";
  let emailError: string | undefined;

  // Best-effort email send — always log regardless of result (Phase 01-02 pattern)
  try {
    await sendPaymentReminderEmail({
      to: recipientEmail,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      daysOverdue,
      amountDue: invoice.totalGross,
      level,
      dueAt: invoice.dueAt ?? new Date(),
    });
  } catch (err) {
    emailStatus = "failed";
    emailError = err instanceof Error ? err.message : "Email error";
  }

  // Always log the reminder attempt
  await logReminder({
    caseId,
    level,
    recipientEmail,
    subject,
    sentBy,
    status: emailStatus,
    errorMessage: emailError,
  });

  // Update case status to "reminded" if email succeeded
  if (emailStatus === "sent") {
    try {
      await updateCaseStatus(caseId, "reminded");
    } catch {
      // Non-critical — don't fail the action
    }
  }

  revalidatePath("/windykacja");

  if (emailStatus === "failed") {
    return {
      error: `Przypomnienie zalogowane, ale email nie został wysłany: ${emailError ?? "Nieznany błąd"}`,
    };
  }

  return { success: `Przypomnienie (poziom ${level}) wysłane i zalogowane` };
}
