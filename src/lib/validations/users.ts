import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki"),
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  role: z.enum(["admin", "user"]).describe("Rola musi być 'admin' lub 'user'"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki").optional(),
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .transform((val) => val.toLowerCase())
    .optional(),
  role: z.enum(["admin", "user"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
