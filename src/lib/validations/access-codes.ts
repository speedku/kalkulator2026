import { z } from "zod";

export const createAccessCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Kod musi mieć co najmniej 3 znaki")
    .transform((val) => val.toUpperCase()),
  description: z.string().optional(),
  maxUses: z.number().int().min(1, "Maksymalna liczba użyć musi być co najmniej 1").default(1),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const updateAccessCodeSchema = z.object({
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  maxUses: z
    .number()
    .int()
    .min(1, "Maksymalna liczba użyć musi być co najmniej 1")
    .optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type CreateAccessCodeInput = z.infer<typeof createAccessCodeSchema>;
export type UpdateAccessCodeInput = z.infer<typeof updateAccessCodeSchema>;
