"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/dal/activity-log";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

export type ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------
export async function loginAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return {
            error:
              "Nieprawidłowy email lub hasło. Konto może być zablokowane po 5 błędnych próbach.",
          };
        default:
          return { error: "Błąd logowania. Spróbuj ponownie." };
      }
    }
    throw err;
  }

  // Activity log (best-effort — don't fail login if DB is down)
  try {
    await logActivity({
      activityType: "auth",
      action: "login",
      description: `Zalogowano: ${result.data.email}`,
    });
  } catch {
    // ignore
  }

  redirect("/");
}

// ---------------------------------------------------------------------------
// registerAction
// ---------------------------------------------------------------------------
export async function registerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    accessCode: formData.get("accessCode") as string,
  };

  // Validate with Zod
  const result = registerSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Confirm password check
  if (raw.password !== raw.confirmPassword) {
    return {
      fieldErrors: { confirmPassword: "Hasła nie są identyczne" },
    };
  }

  const { name, email, password, accessCode } = result.data;

  // Verify access code
  const code = await prisma.accessCode.findFirst({
    where: {
      code: accessCode,
      isActive: true,
    },
  });

  if (!code) {
    return { fieldErrors: { accessCode: "Nieprawidłowy lub nieaktywny kod dostępu" } };
  }

  if (code.expiresAt && code.expiresAt < new Date()) {
    return { fieldErrors: { accessCode: "Kod dostępu wygasł" } };
  }

  if (code.maxUses !== null && code.currentUses >= code.maxUses) {
    return { fieldErrors: { accessCode: "Kod dostępu osiągnął limit użyć" } };
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Ten adres email jest już zajęty" } };
  }

  // Hash password (cost 12 — matches PHP hashes)
  const passwordHash = await bcryptjs.hash(password, 12);

  // Generate verification token
  const rawToken = crypto.randomUUID();
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Create user
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "user",
      isActive: true,
      emailVerified: false,
      accessCodeId: code.id,
      verificationToken: tokenHash,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Increment access code uses
  await prisma.accessCode.update({
    where: { id: code.id },
    data: { currentUses: { increment: 1 } },
  });

  // Send verification email (best-effort)
  try {
    await sendVerificationEmail(email, rawToken);
  } catch {
    // Log but don't fail registration
  }

  // Activity log (best-effort)
  try {
    await logActivity({
      activityType: "auth",
      action: "create",
      description: `Zarejestrowano nowe konto: ${email}`,
      entityType: "user",
      entityName: name,
    });
  } catch {
    // ignore
  }

  return {
    success: true,
    message:
      "Konto zostało utworzone. Sprawdź swoją skrzynkę email i potwierdź adres, aby się zalogować.",
  };
}

// ---------------------------------------------------------------------------
// forgotPasswordAction
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = { email: formData.get("email") as string };

  const result = forgotPasswordSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { email } = result.data;

  // Always respond the same — don't reveal if user exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    const rawToken = crypto.randomUUID();
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send email (best-effort)
    try {
      await sendPasswordResetEmail(email, rawToken);
    } catch {
      // ignore SMTP errors — still respond with success
    }

    // Activity log
    try {
      await logActivity({
        activityType: "auth",
        action: "update",
        description: `Żądanie resetu hasła: ${email}`,
        entityType: "user",
        entityId: user.id,
      });
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message:
      "Jeśli konto z tym adresem istnieje, wysłaliśmy link do resetowania hasła. Sprawdź skrzynkę email.",
  };
}

// ---------------------------------------------------------------------------
// resetPasswordAction
// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = resetPasswordSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { token, password } = result.data;

  // Hash the URL token and find user
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return {
      error: "Link do resetowania hasła jest nieprawidłowy lub wygasł.",
    };
  }

  // Hash new password
  const passwordHash = await bcryptjs.hash(password, 12);

  // Update user, clear token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Activity log
  try {
    await logActivity({
      activityType: "auth",
      action: "update",
      description: `Hasło zostało zresetowane dla: ${user.email}`,
      entityType: "user",
      entityId: user.id,
    });
  } catch {
    // ignore
  }

  return {
    success: true,
    message: "Hasło zostało zmienione. Możesz się teraz zalogować.",
  };
}
