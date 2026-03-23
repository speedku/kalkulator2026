import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  name: z.string().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki"),
  accessCode: z.string().min(1, "Kod dostępu jest wymagany"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .transform((val) => val.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token jest wymagany"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(8, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
