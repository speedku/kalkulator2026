"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/aether/glass-card";
import { SubmitButton } from "@/components/aether/glow-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <GlassCard className="p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-aether-blue/20">
            <svg
              className="size-6 text-aether-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold text-aether-text">
          Sprawdź skrzynkę email
        </h2>
        <p className="mt-2 text-sm text-aether-text-secondary">{state.message}</p>
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
        <h2 className="mb-2 font-display text-xl font-semibold text-aether-text">
          Nie pamiętasz hasła?
        </h2>
        <p className="mb-6 text-sm text-aether-text-secondary">
          Podaj adres email powiązany z kontem, a wyślemy Ci link do resetu hasła.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-lg border border-aether-rose/30 bg-aether-rose/10 px-4 py-3 text-sm text-aether-rose">
              {state.error}
            </div>
          )}

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

          <SubmitButton variant="primary" size="lg" className="mt-2 w-full">
            Wyślij link resetujący
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-aether-text-secondary">
          <Link
            href="/login"
            className="text-aether-blue hover:text-aether-blue/80 transition-colors"
          >
            Wróć do logowania
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
