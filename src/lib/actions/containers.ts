"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createContainer,
  updateContainerStatus,
  addContainerItem,
  removeContainerItem,
  addContainerDocument,
  getContainerById,
} from "@/lib/dal/containers";
import {
  ContainerSchema,
  ContainerStatusSchema,
  ContainerItemSchema,
  ContainerDocumentSchema,
  NotifyContainerSchema,
  type ContainerDocumentInput,
} from "@/lib/validations/containers";
import { sendContainerStatusEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

type ActionState = { error?: string; success?: string };

export async function createContainerAction(
  formData: FormData
): Promise<ActionState & { id?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = ContainerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    const container = await createContainer(parsed.data, Number(session.user.id));
    revalidatePath("/containers");
    return { success: `Kontener ${container.containerNumber} utworzony`, id: container.id };
  } catch {
    return { error: "Błąd tworzenia kontenera" };
  }
}

export async function updateContainerStatusAction(
  id: number,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = ContainerStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await updateContainerStatus(
      id,
      parsed.data.status,
      parsed.data.actualArrivalDate ?? null,
      Number(session.user.id)
    );
    revalidatePath("/containers");
    revalidatePath(`/containers/${id}`);
    return { success: "Status kontenera zaktualizowany" };
  } catch {
    return { error: "Błąd aktualizacji statusu" };
  }
}

export async function addContainerItemAction(
  containerId: number,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = ContainerItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await addContainerItem(containerId, parsed.data);
    revalidatePath(`/containers/${containerId}`);
    return { success: "Produkt dodany do kontenera" };
  } catch {
    return { error: "Błąd dodawania produktu" };
  }
}

export async function removeContainerItemAction(itemId: number): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  try {
    await removeContainerItem(itemId);
    revalidatePath("/containers");
    return { success: "Produkt usunięty z kontenera" };
  } catch {
    return { error: "Błąd usuwania produktu" };
  }
}

export async function addContainerDocumentAction(
  containerId: number,
  data: ContainerDocumentInput
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const parsed = ContainerDocumentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await addContainerDocument(containerId, parsed.data, Number(session.user.id));
    revalidatePath(`/containers/${containerId}`);
    return { success: "Dokument dodany" };
  } catch {
    return { error: "Błąd dodawania dokumentu" };
  }
}

export async function notifyContainerAction(
  containerId: number,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = NotifyContainerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  const container = await getContainerById(containerId);
  if (!container) return { error: "Kontener nie istnieje" };

  let emailStatus = "sent";
  let errorMessage: string | null = null;

  try {
    await sendContainerStatusEmail({
      to: parsed.data.recipientEmail,
      containerNumber: container.containerNumber,
      status: container.status,
      etaDate: container.etaDate,
      notificationType: parsed.data.notificationType,
    });
  } catch (err) {
    emailStatus = "failed";
    errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
  }

  // Record notification regardless of email success/failure
  await prisma.containerNotification.create({
    data: {
      containerId,
      notificationType: parsed.data.notificationType,
      recipientEmail: parsed.data.recipientEmail,
      status: emailStatus,
      errorMessage,
    },
  });

  if (emailStatus === "failed") {
    return { error: `Błąd wysyłania powiadomienia: ${errorMessage}` };
  }

  return { success: `Powiadomienie wysłane do ${parsed.data.recipientEmail}` };
}
