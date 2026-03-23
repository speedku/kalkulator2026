"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/aether/glass-card";
import { SubmitButton } from "@/components/aether/glow-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col gap-6">
      {/* Logo / Brand */}
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
          Zaloguj się
        </h2>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Global error */}
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-aether-text-secondary text-sm">
                Hasło
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-aether-blue hover:text-aether-blue/80 transition-colors"
              >
                Nie pamiętasz hasła?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="bg-aether-void/50 border-aether-border text-aether-text placeholder:text-aether-text-muted focus-visible:border-aether-blue"
            />
            {state.fieldErrors?.password && (
              <span className="text-xs text-aether-rose">
                {state.fieldErrors.password}
              </span>
            )}
          </div>

          <SubmitButton variant="primary" size="lg" className="mt-2 w-full">
            Zaloguj się
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-aether-text-secondary">
          Nie masz konta?{" "}
          <Link
            href="/register"
            className="text-aether-blue hover:text-aether-blue/80 transition-colors"
          >
            Zarejestruj się
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
