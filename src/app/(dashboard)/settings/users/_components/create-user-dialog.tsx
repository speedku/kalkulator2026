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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlowButton, SubmitButton } from "@/components/aether/glow-button";
import { createUserAction } from "@/lib/actions/users";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "w-full h-10 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

export function CreateUserDialog() {
  const [state, action] = useActionState(createUserAction, {});
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState("user");

  React.useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <GlowButton size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Dodaj użytkownika
          </GlowButton>
        }
      />
      <DialogContent className="bg-aether-elevated border-aether-border text-aether-text max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-aether-text">
            Nowy użytkownik
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="id" value="" />
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">
              Imię i nazwisko
            </label>
            <input
              name="name"
              placeholder="Jan Kowalski"
              className={inputClass}
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-aether-rose">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">Email</label>
            <input
              name="email"
              type="email"
              placeholder="jan@firma.pl"
              className={inputClass}
              required
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-aether-rose">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">Hasło</label>
            <input
              name="password"
              type="password"
              placeholder="Minimum 8 znaków"
              className={inputClass}
              required
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-aether-rose">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">Rola</label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (v !== null) setRole(v);
              }}
            >
              <SelectTrigger className="h-10 bg-aether-elevated border-aether-border text-aether-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-aether-elevated border-aether-border">
                <SelectItem value="user" className="text-aether-text">
                  Użytkownik
                </SelectItem>
                <SelectItem value="admin" className="text-aether-text">
                  Administrator
                </SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="role" value={role} />
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
            <SubmitButton>Utwórz użytkownika</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
