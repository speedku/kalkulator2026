import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";
import { differenceInDays } from "date-fns";

// ---- Types ----

export type AgingBucket = "current" | "0-30" | "31-60" | "61-90" | "90+";

export interface AgingRow {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerNip: string | null;
  totalGross: number;
  dueAt: Date | null;
  daysOverdue: number;
  bucket: AgingBucket;
  caseId: number | null;
  caseStatus: string | null;
}

export interface AgingSummary {
  totalOverdue: number;
  countOverdue: number;
  buckets: Record<AgingBucket, { count: number; amount: number }>;
}

export interface CaseRow {
  id: number;
  invoiceId: number;
  customerId: number | null;
  status: string;
  priority: string;
  notes: string | null;
  assignedTo: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseDetailRow extends CaseRow {
  invoice: {
    id: number;
    invoiceNumber: string;
    customerName: string;
    totalGross: number;
    dueAt: Date | null;
    status: string;
  };
  reminderLogs: ReminderLogRow[];
}

export interface ReminderLogRow {
  id: number;
  caseId: number;
  level: number;
  recipientEmail: string;
  subject: string;
  bodyHtml: string | null;
  sentBy: number | null;
  sentAt: Date;
  status: string;
  errorMessage: string | null;
}

// ---- Aging helpers ----

function toBucket(dueAt: Date | null): AgingBucket {
  if (!dueAt) return "current";
  const d = differenceInDays(new Date(), dueAt);
  if (d <= 0) return "current";
  if (d <= 30) return "0-30";
  if (d <= 60) return "31-60";
  if (d <= 90) return "61-90";
  return "90+";
}

// ---- DAL functions ----

export async function getAgingData(): Promise<{
  rows: AgingRow[];
  summary: AgingSummary;
}> {
  await requireAdmin();

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["issued", "draft"] },
      dueAt: { not: null, lt: new Date() },
    },
    select: {
      id: true,
      invoiceNumber: true,
      customerName: true,
      customerNip: true,
      totalGross: true,
      dueAt: true,
      invoiceCase: { select: { id: true, status: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  const rows: AgingRow[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerNip: inv.customerNip,
    totalGross: Number(inv.totalGross),
    dueAt: inv.dueAt,
    daysOverdue: inv.dueAt ? differenceInDays(new Date(), inv.dueAt) : 0,
    bucket: toBucket(inv.dueAt),
    caseId: inv.invoiceCase?.id ?? null,
    caseStatus: inv.invoiceCase?.status ?? null,
  }));

  const summary: AgingSummary = {
    totalOverdue: rows.reduce((s, r) => s + r.totalGross, 0),
    countOverdue: rows.length,
    buckets: {
      current: { count: 0, amount: 0 },
      "0-30": { count: 0, amount: 0 },
      "31-60": { count: 0, amount: 0 },
      "61-90": { count: 0, amount: 0 },
      "90+": { count: 0, amount: 0 },
    },
  };

  rows.forEach((r) => {
    summary.buckets[r.bucket].count++;
    summary.buckets[r.bucket].amount += r.totalGross;
  });

  return { rows, summary };
}

export async function getWindykacjaCases(opts?: {
  status?: string;
}): Promise<(CaseRow & { _count: { reminderLogs: number } })[]> {
  await requireAdmin();

  const where: Record<string, unknown> = {};
  if (opts?.status) {
    where.status = opts.status;
  }

  return prisma.windykacjaCase.findMany({
    where,
    include: {
      _count: { select: { reminderLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWindykacjaCase(id: number): Promise<CaseDetailRow | null> {
  await requireAdmin();

  const result = await prisma.windykacjaCase.findUnique({
    where: { id },
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          totalGross: true,
          dueAt: true,
          status: true,
        },
      },
      reminderLogs: {
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    invoice: {
      ...result.invoice,
      totalGross: Number(result.invoice.totalGross),
    },
  };
}

export async function createWindykacjaCase(data: {
  invoiceId: number;
  customerId?: number;
  priority?: string;
  notes?: string;
}): Promise<{ id: number }> {
  await requireAdmin();

  const windykacjaCase = await prisma.windykacjaCase.create({
    data: {
      invoiceId: data.invoiceId,
      customerId: data.customerId ?? undefined,
      priority: data.priority ?? "normal",
      notes: data.notes ?? undefined,
    },
    select: { id: true },
  });

  return { id: windykacjaCase.id };
}

export async function updateCaseStatus(
  id: number,
  status: string,
  resolvedAt?: Date
): Promise<void> {
  await requireAdmin();

  await prisma.windykacjaCase.update({
    where: { id },
    data: {
      status,
      resolvedAt: resolvedAt ?? undefined,
    },
  });
}

export async function logReminder(data: {
  caseId: number;
  level: number;
  recipientEmail: string;
  subject: string;
  bodyHtml?: string;
  sentBy?: number;
  status: "sent" | "failed";
  errorMessage?: string;
}): Promise<void> {
  await requireAdmin();

  await prisma.reminderLog.create({
    data: {
      caseId: data.caseId,
      level: data.level,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      bodyHtml: data.bodyHtml ?? undefined,
      sentBy: data.sentBy ?? undefined,
      status: data.status,
      errorMessage: data.errorMessage ?? undefined,
    },
  });
}
