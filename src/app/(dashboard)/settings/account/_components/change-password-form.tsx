"use client";
import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/user-settings";
import { GlowButton } from "@/components/aether/glow-button";

const initialState = { error: undefined, success: undefined };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs text-aether-text-secondary mb-1">Aktualne hasło</label>
        <input
          type="password"
          name="currentPassword"
          required
          className="w-full rounded-lg border border-aether-border bg-aether-bg px-3 py-2 text-sm text-aether-text outline-none focus:border-aether-blue/60"
        />
      </div>
      <div>
        <label className="block text-xs text-aether-text-secondary mb-1">Nowe hasło</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          className="w-full rounded-lg border border-aether-border bg-aether-bg px-3 py-2 text-sm text-aether-text outline-none focus:border-aether-blue/60"
        />
      </div>
      <div>
        <label className="block text-xs text-aether-text-secondary mb-1">Potwierdź nowe hasło</label>
        <input
          type="password"
          name="confirmPassword"
          required
          className="w-full rounded-lg border border-aether-border bg-aether-bg px-3 py-2 text-sm text-aether-text outline-none focus:border-aether-blue/60"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-aether-rose">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-aether-emerald">{state.success}</p>
      )}
      <GlowButton type="submit" disabled={isPending}>
        {isPending ? "Zapisywanie..." : "Zmień hasło"}
      </GlowButton>
    </form>
  );
}
