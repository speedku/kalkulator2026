"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { GlassCard } from "@/components/aether/glass-card";
import { SubmitButton } from "@/components/aether/glow-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  if (state.success) {
    return (
      <GlassCard className="p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-aether-emerald/20">
            <svg
              className="size-6 text-aether-emerald"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold text-aether-text">
          Hasło zmienione
        </h2>
        <p className="mt-2 text-sm text-aether-text-secondary">{state.message}</p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-aether-blue hover:text-aether-blue/80 transition-colors"
        >
          Przejdź do logowania
        </Link>
      </GlassCard>
    );
  }

  if (!token) {
    return (
      <GlassCard className="p-6 text-center">
        <h2 className="font-display text-xl font-semibold text-aether-rose">
          Nieprawidłowy link
        </h2>
        <p className="mt-2 text-sm text-aether-text-secondary">
          Link do resetowania hasła jest nieprawidłowy lub wygasł.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-aether-blue hover:text-aether-blue/80 transition-colors"
        >
          Wygeneruj nowy link
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h2 className="mb-2 font-display text-xl font-semibold text-aether-text">
        Ustaw nowe hasło
      </h2>
      <p className="mb-6 text-sm text-aether-text-secondary">
        Wprowadź nowe hasło dla swojego konta.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {/* Hidden token field */}
        <input type="hidden" name="token" value={token} />

        {state.error && (
          <div className="rounded-lg border border-aether-rose/30 bg-aether-rose/10 px-4 py-3 text-sm text-aether-rose">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-aether-text-secondary text-sm">
            Nowe hasło
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 znaków"
            required
            className="bg-aether-void/50 border-aether-border text-aether-text placeholder:text-aether-text-muted focus-visible:border-aether-blue"
          />
          {state.fieldErrors?.password && (
            <span className="text-xs text-aether-rose">
              {state.fieldErrors.password}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-aether-text-secondary text-sm"
          >
            Potwierdź nowe hasło
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Powtórz hasło"
            required
            className="bg-aether-void/50 border-aether-border text-aether-text placeholder:text-aether-text-muted focus-visible:border-aether-blue"
          />
          {state.fieldErrors?.confirmPassword && (
            <span className="text-xs text-aether-rose">
              {state.fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        <SubmitButton variant="primary" size="lg" className="mt-2 w-full">
          Zmień hasło
        </SubmitButton>
      </form>
    </GlassCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-aether-text">
          Kalkulator 2026
        </h1>
        <p className="mt-1 text-sm text-aether-text-secondary">
          System Zarządzania Biznesem ALLBAG
        </p>
      </div>
      <Suspense
        fallback={
          <GlassCard className="p-6">
            <div className="h-48 animate-pulse rounded bg-aether-border/20" />
          </GlassCard>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
