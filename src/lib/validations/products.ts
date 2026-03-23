import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(255),
  slug: z
    .string()
    .min(1, "Slug jest wymagany")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug może zawierać tylko małe litery, cyfry i myślniki"),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  productGroupId: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  paperType: z.string().max(100).optional(),
  grammage: z.number().int().positive().optional(),
  boxQuantity: z.number().int().positive().optional(),
  palletQuantity: z.number().int().positive().optional(),
  boxDimensions: z.string().max(50).optional(),
  boxWeight: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.number().int().positive(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, "Wybierz co najmniej jeden produkt"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductFormInput = z.input<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
