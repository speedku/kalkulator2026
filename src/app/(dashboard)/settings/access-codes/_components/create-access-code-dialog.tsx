"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GlowButton, SubmitButton } from "@/components/aether/glow-button";
import { createAccessCodeAction } from "@/lib/actions/access-codes";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "w-full h-10 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

export function CreateAccessCodeDialog() {
  const [state, action] = useActionState(createAccessCodeAction, {});
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <GlowButton size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nowy kod
          </GlowButton>
        }
      />
      <DialogContent className="bg-aether-elevated border-aether-border text-aether-text max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-aether-text">
            Nowy kod dostępu
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">
              Kod (min. 3 znaki, automatycznie duże litery)
            </label>
            <input
              name="code"
              placeholder="ALLBAG2026"
              className={cn(inputClass, "font-mono uppercase")}
              style={{ textTransform: "uppercase" }}
              required
            />
            {state.fieldErrors?.code && (
              <p className="text-xs text-aether-rose">{state.fieldErrors.code[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">
              Opis (opcjonalnie)
            </label>
            <input
              name="description"
              placeholder="Np. dla nowych pracowników Q1 2026"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">
              Maksymalna liczba użyć
            </label>
            <input
              name="maxUses"
              type="number"
              min="1"
              defaultValue="1"
              className={inputClass}
            />
            {state.fieldErrors?.maxUses && (
              <p className="text-xs text-aether-rose">
                {state.fieldErrors.maxUses[0]}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">
              Data wygaśnięcia (opcjonalnie)
            </label>
            <input name="expiresAt" type="date" className={inputClass} />
          </div>
          {state.error && (
            <p className="text-sm text-aether-rose bg-aether-rose/10 border border-aether-rose/30 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-aether-text-secondary hover:text-aether-text transition-colors"
            >
              Anuluj
            </button>
            <SubmitButton>Utwórz kod</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
