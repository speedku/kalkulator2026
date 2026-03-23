"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createDomesticDelivery,
  updateDomesticDeliveryStatus,
} from "@/lib/dal/domestic-deliveries";
import { syncDeliveriesFromSubiekt } from "@/lib/dal/subiekt";
import {
  DomesticDeliverySchema,
  DomesticDeliveryStatusSchema,
} from "@/lib/validations/domestic-deliveries";

type ActionState = { error?: string; success?: string };

export async function createDomesticDeliveryAction(
  formData: FormData
): Promise<ActionState & { id?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = DomesticDeliverySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    const delivery = await createDomesticDelivery(parsed.data, Number(session.user.id));
    revalidatePath("/deliveries");
    return { success: `Dostawa "${delivery.name}" utworzona`, id: delivery.id };
  } catch {
    return { error: "Błąd tworzenia dostawy" };
  }
}

export async function updateDomesticDeliveryStatusAction(
  id: number,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = DomesticDeliveryStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await updateDomesticDeliveryStatus(
      id,
      parsed.data.status,
      parsed.data.actualArrivalDate ?? null,
      Number(session.user.id)
    );
    revalidatePath("/deliveries");
    revalidatePath(`/deliveries/${id}`);
    return { success: "Status dostawy zaktualizowany" };
  } catch {
    return { error: "Błąd aktualizacji statusu dostawy" };
  }
}

export async function syncDeliveriesAction(): Promise<
  ActionState & { discovered?: boolean }
> {
  try {
    const result = await syncDeliveriesFromSubiekt();
    if (result.synced > 0) {
      return { success: `Zsynchronizowano ${result.synced} dostaw z Subiekt GT` };
    }
    if (result.errors.length > 0) {
      return { error: result.errors[0], discovered: result.discovered };
    }
    return { success: "Synchronizacja zakończona — brak nowych dostaw" };
  } catch (e) {
    return { error: "Błąd synchronizacji z Subiekt GT: " + String(e) };
  }
}
