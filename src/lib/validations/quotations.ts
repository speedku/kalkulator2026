import { z } from "zod";

export const quotationItemSchema = z.object({
  productId: z.number().int().nullable(),
  productName: z.string().min(1, "Nazwa produktu jest wymagana"),
  sku: z.string().nullable().default(null),
  quantity: z.number().int().min(1, "Ilość musi być >= 1"),
  unitPrice: z.number().min(0, "Cena musi być >= 0"),
  totalPrice: z.number().min(0),
});

export const createQuotationSchema = z.object({
  customerName: z.string().min(1, "Nazwa klienta jest wymagana").max(255),
  customerEmail: z.string().email("Nieprawidłowy email").nullable().default(null),
  priceListId: z.number().int().nullable().default(null),
  notes: z.string().nullable().default(null),
  items: z.array(quotationItemSchema).min(1, "Wycena musi zawierać przynajmniej jeden produkt"),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export const sendEmailSchema = z.object({
  recipientEmail: z.string().email("Nieprawidłowy adres email"),
});
