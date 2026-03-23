import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";

// ---- Typed row interfaces ----

export interface CustomerRow {
  id: number;
  name: string;
  symbol: string | null;
  email: string | null;
  phone: string | null;
  nip: string | null;
  isActive: boolean;
  lastContactAt: Date | null;
  createdAt: Date;
  _count: { deals: number; leads: number };
}

export interface CustomerDetailRow {
  id: number;
  name: string;
  symbol: string | null;
  email: string | null;
  phone: string | null;
  nip: string | null;
  address: string | null;
  priceListId: number | null;
  accountManager: string | null;
  isActive: boolean;
  lastContactAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  leads: LeadRow[];
  deals: DealRow[];
  windykacjaCases: { id: number; status: string; priority: string; createdAt: Date }[];
}

export interface LeadRow {
  id: number;
  customerId: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealRow {
  id: number;
  customerId: number;
  title: string;
  stage: string;
  value: number | null;
  notes: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerName: string;
}

export interface BrandWatchRow {
  id: number;
  url: string;
  marketplace: string;
  productSku: string | null;
  notes: string | null;
  lastChecked: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Customer functions ----

export async function getCustomers(opts?: {
  search?: string;
  isActive?: boolean;
}): Promise<CustomerRow[]> {
  await requireAdmin();

  const where: Record<string, unknown> = {};

  if (opts?.isActive !== undefined) {
    where.isActive = opts.isActive;
  }

  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
      { nip: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  return prisma.customer.findMany({
    where,
    include: {
      _count: {
        select: { deals: true, leads: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(id: number): Promise<CustomerDetailRow | null> {
  await requireAdmin();

  return prisma.customer.findUnique({
    where: { id },
    include: {
      leads: true,
      deals: true,
      windykacjaCases: {
        select: { id: true, status: true, priority: true, createdAt: true },
      },
    },
  }) as Promise<CustomerDetailRow | null>;
}

export async function createCustomer(
  data: Omit<CustomerDetailRow, "id" | "createdAt" | "updatedAt" | "leads" | "deals" | "windykacjaCases">
): Promise<{ id: number }> {
  await requireAdmin();

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      symbol: data.symbol ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      nip: data.nip ?? undefined,
      address: data.address ?? undefined,
      priceListId: data.priceListId ?? undefined,
      accountManager: data.accountManager ?? undefined,
      isActive: data.isActive ?? true,
      lastContactAt: data.lastContactAt ?? undefined,
      notes: data.notes ?? undefined,
    },
    select: { id: true },
  });

  return { id: customer.id };
}

export async function updateCustomer(
  id: number,
  data: Partial<Omit<CustomerDetailRow, "id" | "createdAt" | "updatedAt" | "leads" | "deals" | "windykacjaCases">>
): Promise<void> {
  await requireAdmin();

  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      symbol: data.symbol,
      email: data.email,
      phone: data.phone,
      nip: data.nip,
      address: data.address,
      priceListId: data.priceListId,
      accountManager: data.accountManager,
      isActive: data.isActive,
      lastContactAt: data.lastContactAt,
      notes: data.notes,
    },
  });
}

export async function deleteCustomer(id: number): Promise<void> {
  await requireAdmin();
  // Soft delete — keep data, mark inactive
  await prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
}

// ---- Lead functions ----

export async function getLeads(opts?: {
  status?: string;
  search?: string;
}): Promise<LeadRow[]> {
  await requireAdmin();

  const where: Record<string, unknown> = {};

  if (opts?.status) {
    where.status = opts.status;
  }

  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
      { company: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function createLead(
  data: Omit<LeadRow, "id" | "createdAt" | "updatedAt">
): Promise<{ id: number }> {
  await requireAdmin();

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      customerId: data.customerId ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      company: data.company ?? undefined,
      source: data.source ?? undefined,
      status: data.status ?? "new",
      notes: data.notes ?? undefined,
    },
    select: { id: true },
  });

  return { id: lead.id };
}

export async function updateLead(
  id: number,
  data: Partial<Omit<LeadRow, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await requireAdmin();

  await prisma.lead.update({
    where: { id },
    data: {
      name: data.name,
      customerId: data.customerId,
      email: data.email,
      phone: data.phone,
      company: data.company,
      source: data.source,
      status: data.status,
      notes: data.notes,
    },
  });
}

export async function deleteLead(id: number): Promise<void> {
  await requireAdmin();
  await prisma.lead.delete({ where: { id } });
}

// ---- Deal functions ----

export async function getDeals(opts?: {
  stage?: string;
  customerId?: number;
}): Promise<DealRow[]> {
  await requireAdmin();

  const where: Record<string, unknown> = {};

  if (opts?.stage) {
    where.stage = opts.stage;
  }

  if (opts?.customerId) {
    where.customerId = opts.customerId;
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return deals.map((d) => ({
    id: d.id,
    customerId: d.customerId,
    title: d.title,
    stage: d.stage,
    value: d.value != null ? Number(d.value) : null,
    notes: d.notes,
    closedAt: d.closedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    customerName: d.customer.name,
  }));
}

export async function createDeal(
  data: Omit<DealRow, "id" | "createdAt" | "updatedAt" | "customerName">
): Promise<{ id: number }> {
  await requireAdmin();

  const deal = await prisma.deal.create({
    data: {
      customerId: data.customerId,
      title: data.title,
      stage: data.stage ?? "prospecting",
      value: data.value ?? undefined,
      notes: data.notes ?? undefined,
      closedAt: data.closedAt ?? undefined,
    },
    select: { id: true },
  });

  return { id: deal.id };
}

export async function updateDeal(
  id: number,
  data: Partial<Omit<DealRow, "id" | "createdAt" | "updatedAt" | "customerName">>
): Promise<void> {
  await requireAdmin();

  await prisma.deal.update({
    where: { id },
    data: {
      customerId: data.customerId,
      title: data.title,
      stage: data.stage,
      value: data.value,
      notes: data.notes,
      closedAt: data.closedAt,
    },
  });
}

// ---- BrandWatchItem functions ----

export async function getBrandWatchItems(): Promise<BrandWatchRow[]> {
  await requireAdmin();

  return prisma.brandWatchItem.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createBrandWatchItem(
  data: Omit<BrandWatchRow, "id" | "createdAt" | "updatedAt">
): Promise<{ id: number }> {
  await requireAdmin();

  const item = await prisma.brandWatchItem.create({
    data: {
      url: data.url,
      marketplace: data.marketplace,
      productSku: data.productSku ?? undefined,
      notes: data.notes ?? undefined,
      lastChecked: data.lastChecked ?? undefined,
      status: data.status ?? "active",
    },
    select: { id: true },
  });

  return { id: item.id };
}

export async function updateBrandWatchItem(
  id: number,
  data: Partial<Omit<BrandWatchRow, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await requireAdmin();

  await prisma.brandWatchItem.update({
    where: { id },
    data: {
      url: data.url,
      marketplace: data.marketplace,
      productSku: data.productSku,
      notes: data.notes,
      lastChecked: data.lastChecked,
      status: data.status,
    },
  });
}

export async function deleteBrandWatchItem(id: number): Promise<void> {
  await requireAdmin();
  await prisma.brandWatchItem.delete({ where: { id } });
}
