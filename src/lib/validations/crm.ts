import { z } from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(1).max(255),
  symbol: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  nip: z.string().max(20).optional(),
  address: z.string().optional(),
  priceListId: z.number().int().positive().optional().nullable(),
  accountManager: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
  lastContactAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

export const LeadSchema = z.object({
  name: z.string().min(1).max(255),
  customerId: z.number().int().positive().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  notes: z.string().optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;

export const DealSchema = z.object({
  customerId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  stage: z
    .enum(["prospecting", "proposal", "negotiation", "closed_won", "closed_lost"])
    .default("prospecting"),
  value: z.number().positive().optional().nullable(),
  notes: z.string().optional(),
  closedAt: z.string().datetime().optional().nullable(),
});

export type DealInput = z.infer<typeof DealSchema>;

export const BrandWatchItemSchema = z.object({
  url: z.string().url().max(500),
  marketplace: z.string().min(1).max(100),
  productSku: z.string().max(100).optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "resolved", "flagged"]).default("active"),
});

export type BrandWatchItemInput = z.infer<typeof BrandWatchItemSchema>;
