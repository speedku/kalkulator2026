"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clonePriceListAction } from "@/lib/actions/price-lists";
import { GlowButton } from "@/components/aether/glow-button";
import { cn } from "@/lib/utils";

interface CloneDialogProps {
  sourceId: number;
  sourceName: string;
}

const inputClass = cn(
  "w-full h-9 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

const labelClass = "block text-sm font-medium text-aether-text-secondary mb-1";
const errorClass = "mt-1 text-xs text-red-400";

export function CloneDialog({ sourceId, sourceName }: CloneDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCloning, setIsCloning] = React.useState(false);
  const [newCode, setNewCode] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [errors, setErrors] = React.useState<{ code?: string; name?: string }>({});

  function validate() {
    const errs: { code?: string; name?: string } = {};
    if (!newCode.trim()) errs.code = "Kod jest wymagany";
    else if (!/^[A-Z0-9_]+$/.test(newCode.toUpperCase()))
      errs.code = "Kod: tylko wielkie litery, cyfry i podkreślnik";
    if (!newName.trim()) errs.name = "Nazwa jest wymagana";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleClone() {
    if (!validate()) return;

    setIsCloning(true);
    const result = await clonePriceListAction({
      sourceId,
      newCode: newCode.toUpperCase(),
      newName,
    });
    setIsCloning(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success ?? "Cennik sklonowany");
      setIsOpen(false);
      setNewCode("");
      setNewName("");
      if (result.newId) {
        router.push(`/price-lists/${result.newId}`);
      }
    }
  }

  function handleClose() {
    setIsOpen(false);
    setNewCode("");
    setNewName("");
    setErrors({});
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <p className="text-sm text-aether-text-secondary">
          Sklonuj cennik <strong className="text-aether-text">{sourceName}</strong> — skopiuje wszystkie marże do nowego cennika.
        </p>
        <GlowButton variant="secondary" onClick={() => setIsOpen(true)}>
          Klonuj cennik
        </GlowButton>
      </div>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-aether-surface border border-aether-border shadow-2xl p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-aether-text">
                Klonuj cennik
              </h2>
              <p className="mt-1 text-sm text-aether-text-secondary">
                Klon cennika <strong>{sourceName}</strong> z wszystkimi marżami
              </p>
            </div>

            <div>
              <label className={labelClass}>Nowy kod *</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="np. STANDARD_KOPIA"
                className={inputClass}
              />
              {errors.code && <p className={errorClass}>{errors.code}</p>}
            </div>

            <div>
              <label className={labelClass}>Nowa nazwa *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nazwa nowego cennika"
                className={inputClass}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <GlowButton variant="secondary" onClick={handleClose}>
                Anuluj
              </GlowButton>
              <GlowButton loading={isCloning} onClick={handleClone}>
                Sklonuj
              </GlowButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
