import { z } from "zod";

export const createPriceListSchema = z.object({
  code: z
    .string()
    .min(1, "Kod jest wymagany")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Kod: tylko wielkie litery, cyfry i podkreślnik"),
  name: z.string().min(1, "Nazwa jest wymagana").max(100),
  description: z.string().optional(),
  displayOrder: z.coerce.number().int().default(0),
});

export const updatePriceListSchema = createPriceListSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const marginEntrySchema = z.object({
  productGroupId: z.number().int().positive(),
  marginPercent: z
    .number()
    .min(0, "Marża nie może być ujemna")
    .max(99.99, "Marża musi być < 100%"),
});

export const batchMarginsSchema = z.object({
  priceListId: z.number().int().positive(),
  margins: z.array(marginEntrySchema).min(1),
});

export const assignPriceListSchema = z.object({
  userId: z.number().int().positive(),
  priceListId: z.number().int().positive().nullable(),
});

export const clonePriceListSchema = z.object({
  sourceId: z.number().int().positive(),
  newCode: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Kod: tylko wielkie litery, cyfry i podkreślnik"),
  newName: z.string().min(1).max(100),
});

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;
export type CreatePriceListFormInput = z.input<typeof createPriceListSchema>;
export type UpdatePriceListInput = z.infer<typeof updatePriceListSchema>;
export type BatchMarginsInput = z.infer<typeof batchMarginsSchema>;
export type AssignPriceListInput = z.infer<typeof assignPriceListSchema>;
export type ClonePriceListInput = z.infer<typeof clonePriceListSchema>;
