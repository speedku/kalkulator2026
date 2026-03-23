import { z } from "zod";

export const WindykacjaCaseSchema = z.object({
  invoiceId: z.number().int().positive(),
  customerId: z.number().int().positive().optional().nullable(),
  status: z
    .enum(["open", "reminded", "in_dispute", "settled", "written_off"])
    .default("open"),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  notes: z.string().optional(),
  assignedTo: z.number().int().positive().optional().nullable(),
});

export type WindykacjaCaseInput = z.infer<typeof WindykacjaCaseSchema>;

export const SendReminderSchema = z.object({
  caseId: z.number().int().positive(),
  recipientEmail: z.string().email(),
  level: z.number().int().min(1).max(4),
});

export type SendReminderInput = z.infer<typeof SendReminderSchema>;
