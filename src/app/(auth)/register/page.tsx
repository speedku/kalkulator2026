"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/aether/glass-card";
import { SubmitButton } from "@/components/aether/glow-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerAction, initialState);

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
          Rejestracja zakończona
        </h2>
        <p className="mt-2 text-sm text-aether-text-secondary">
          {state.message}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-aether-blue hover:text-aether-blue/80 transition-colors"
        >
          Wróć do logowania
        </Link>
      </GlassCard>
    );
  }

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

      <GlassCard className="p-6">
        <h2 className="mb-6 font-display text-xl font-semibold text-aether-text">
          Utwórz konto
        </h2>

        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-lg border border-aether-rose/30 bg-aether-rose/10 px-4 py-3 text-sm text-aether-rose">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-aether-text-secondary text-sm">
              Imię i nazwisko
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jan Kowalski"
              required
              className="bg-aether-void/50 border-aether-border text-aether-text placeholder:text-aether-text-muted focus-visible:border-aether-blue"
            />
            {state.fieldErrors?.name && (
              <span className="text-xs text-aether-rose">
                {state.fieldErrors.name}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-aether-text-secondary text-sm">
              Adres email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jan@example.com"
              required
              className="bg-aether-void/50 border-aether-border text-aether-text placeholder:text-aether-text-muted focus-visible:border-aether-blue"
            />
            {state.fieldErrors?.email && (
              <span className="text-xs text-aether-rose">
                {state.fieldErrors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-aether-text-secondary text-sm">
              Hasło
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
              Potwierdź hasło
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

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="accessCode"
              className="text-aether-text-secondary text-sm"
            >
              Kod dostępu
            </Label>
            <Input
              id="accessCode"
              name="accessCode"
              type="text"
              autoComplete="off"
              placeholder="Wprowadź kod dostępu"
              required
              className="bg-aether-void/50 border-aether-border text-aether-text placeholder:text-aether-text-muted focus-visible:border-aether-blue font-mono"
            />
            {state.fieldErrors?.accessCode && (
              <span className="text-xs text-aether-rose">
                {state.fieldErrors.accessCode}
              </span>
            )}
          </div>

          <SubmitButton variant="primary" size="lg" className="mt-2 w-full">
            Utwórz konto
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-aether-text-secondary">
          Masz już konto?{" "}
          <Link
            href="/login"
            className="text-aether-blue hover:text-aether-blue/80 transition-colors"
          >
            Zaloguj się
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
