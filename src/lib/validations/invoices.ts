import { z } from "zod";

export const invoiceItemSchema = z.object({
  productId: z.number().int().nullable(),
  productName: z.string().min(1, "Nazwa produktu jest wymagana"),
  sku: z.string().nullable().default(null),
  quantity: z.number().int().min(1),
  unitNet: z.number().min(0),
  totalNet: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  customerName: z.string().min(1, "Nazwa klienta jest wymagana").max(255),
  customerAddress: z.string().nullable().default(null),
  customerNip: z.string().nullable().default(null),
  vatRate: z.number().int().min(0).max(100).default(23),
  issuedAt: z.string().nullable().default(null), // ISO date string from form
  dueAt: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  items: z.array(invoiceItemSchema).min(1, "Faktura musi zawierać przynajmniej jedną pozycję"),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
