"use server";
import { revalidatePath } from "next/cache";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createLead,
  updateLead,
  deleteLead,
  createDeal,
  updateDeal,
  createBrandWatchItem,
  updateBrandWatchItem,
  deleteBrandWatchItem,
} from "@/lib/dal/crm";
import {
  CustomerSchema,
  LeadSchema,
  DealSchema,
  BrandWatchItemSchema,
} from "@/lib/validations/crm";

type ActionState = { error?: string; success?: string };

// ---- Customer Actions ----

export async function createCustomerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = CustomerSchema.safeParse({
    ...raw,
    isActive: raw.isActive === "true" || raw.isActive === "on" || raw.isActive === undefined ? true : false,
    priceListId: raw.priceListId ? Number(raw.priceListId) : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await createCustomer({
      name: parsed.data.name,
      symbol: parsed.data.symbol ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      nip: parsed.data.nip ?? null,
      address: parsed.data.address ?? null,
      priceListId: parsed.data.priceListId ?? null,
      accountManager: parsed.data.accountManager ?? null,
      isActive: parsed.data.isActive ?? true,
      lastContactAt: parsed.data.lastContactAt ? new Date(parsed.data.lastContactAt) : null,
      notes: parsed.data.notes ?? null,
    });
    revalidatePath("/crm");
    return { success: "Klient utworzony" };
  } catch {
    return { error: "Nie udało się utworzyć klienta" };
  }
}

export async function updateCustomerAction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = CustomerSchema.safeParse({
    ...raw,
    isActive: raw.isActive === "true" || raw.isActive === "on",
    priceListId: raw.priceListId ? Number(raw.priceListId) : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await updateCustomer(id, {
      name: parsed.data.name,
      symbol: parsed.data.symbol ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      nip: parsed.data.nip ?? null,
      address: parsed.data.address ?? null,
      priceListId: parsed.data.priceListId ?? null,
      accountManager: parsed.data.accountManager ?? null,
      isActive: parsed.data.isActive ?? true,
      lastContactAt: parsed.data.lastContactAt ? new Date(parsed.data.lastContactAt) : null,
      notes: parsed.data.notes ?? null,
    });
    revalidatePath("/crm");
    return { success: "Klient zaktualizowany" };
  } catch {
    return { error: "Nie udało się zaktualizować klienta" };
  }
}

export async function deleteCustomerAction(id: number): Promise<ActionState> {
  try {
    await deleteCustomer(id);
    revalidatePath("/crm");
    return { success: "Klient dezaktywowany" };
  } catch {
    return { error: "Nie udało się dezaktywować klienta" };
  }
}

// ---- Lead Actions ----

export async function createLeadAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = LeadSchema.safeParse({
    ...raw,
    customerId: raw.customerId ? Number(raw.customerId) : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await createLead({
      name: parsed.data.name,
      customerId: parsed.data.customerId ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      source: parsed.data.source ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    });
    revalidatePath("/crm/leads");
    return { success: "Lead dodany" };
  } catch {
    return { error: "Nie udało się dodać leada" };
  }
}

export async function updateLeadAction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = LeadSchema.safeParse({
    ...raw,
    customerId: raw.customerId ? Number(raw.customerId) : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await updateLead(id, {
      name: parsed.data.name,
      customerId: parsed.data.customerId ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      source: parsed.data.source ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    });
    revalidatePath("/crm/leads");
    return { success: "Lead zaktualizowany" };
  } catch {
    return { error: "Nie udało się zaktualizować leada" };
  }
}

export async function deleteLeadAction(id: number): Promise<ActionState> {
  try {
    await deleteLead(id);
    revalidatePath("/crm/leads");
    return { success: "Lead usunięty" };
  } catch {
    return { error: "Nie udało się usunąć leada" };
  }
}

// ---- Deal Actions ----

export async function createDealAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = DealSchema.safeParse({
    ...raw,
    customerId: raw.customerId ? Number(raw.customerId) : undefined,
    value: raw.value ? Number(raw.value) : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await createDeal({
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      stage: parsed.data.stage,
      value: parsed.data.value ?? null,
      notes: parsed.data.notes ?? null,
      closedAt: parsed.data.closedAt ? new Date(parsed.data.closedAt) : null,
    });
    revalidatePath("/crm/pipeline");
    return { success: "Deal dodany" };
  } catch {
    return { error: "Nie udało się dodać deala" };
  }
}

export async function updateDealAction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = DealSchema.safeParse({
    ...raw,
    customerId: raw.customerId ? Number(raw.customerId) : undefined,
    value: raw.value ? Number(raw.value) : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await updateDeal(id, {
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      stage: parsed.data.stage,
      value: parsed.data.value ?? null,
      notes: parsed.data.notes ?? null,
      closedAt: parsed.data.closedAt ? new Date(parsed.data.closedAt) : null,
    });
    revalidatePath("/crm/pipeline");
    return { success: "Deal zaktualizowany" };
  } catch {
    return { error: "Nie udało się zaktualizować deala" };
  }
}

// ---- BrandWatchItem Actions ----

export async function createBrandWatchItemAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = BrandWatchItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await createBrandWatchItem({
      url: parsed.data.url,
      marketplace: parsed.data.marketplace,
      productSku: parsed.data.productSku ?? null,
      notes: parsed.data.notes ?? null,
      lastChecked: null,
      status: parsed.data.status,
    });
    revalidatePath("/crm");
    return { success: "Element dodany do monitoringu" };
  } catch {
    return { error: "Nie udało się dodać elementu" };
  }
}

export async function updateBrandWatchItemAction(
  id: number,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = BrandWatchItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await updateBrandWatchItem(id, {
      url: parsed.data.url,
      marketplace: parsed.data.marketplace,
      productSku: parsed.data.productSku ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.status,
    });
    revalidatePath("/crm");
    return { success: "Element zaktualizowany" };
  } catch {
    return { error: "Nie udało się zaktualizować elementu" };
  }
}

export async function deleteBrandWatchItemAction(id: number): Promise<ActionState> {
  try {
    await deleteBrandWatchItem(id);
    revalidatePath("/crm");
    return { success: "Element usunięty" };
  } catch {
    return { error: "Nie udało się usunąć elementu" };
  }
}
