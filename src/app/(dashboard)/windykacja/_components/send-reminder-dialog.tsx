"use client";

import { useState, useActionState } from "react";
import { toast } from "sonner";
import { sendReminderAction } from "@/lib/actions/windykacja";

interface SendReminderDialogProps {
  caseId: number;
  currentLevel: number;
  invoiceNumber: string;
  recipientEmail: string;
}

type ActionState = { error?: string; success?: string };

const initialState: ActionState = {};

export function SendReminderDialog({
  caseId,
  currentLevel,
  invoiceNumber,
  recipientEmail,
}: SendReminderDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState(recipientEmail);

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await sendReminderAction(prevState, formData);
      if (result.success) {
        toast.success(result.success);
        setShowDialog(false);
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    initialState
  );

  const levelLabels = [
    "",
    "Pierwsze przypomnienie",
    "Drugie przypomnienie",
    "Pilne przypomnienie",
    "Ostateczne wezwanie",
  ];
  const levelLabel = levelLabels[currentLevel] ?? `Poziom ${currentLevel}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-9 px-3 text-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
      >
        Wyślij przypomnienie
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              aria-label="Zamknij"
            >
              ✕
            </button>
            <h2 className="mb-1 text-lg font-semibold text-white">
              Wyślij przypomnienie
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              Faktura {invoiceNumber} — {levelLabel}
            </p>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="caseId" value={caseId} />
              <input type="hidden" name="level" value={currentLevel} />

              {/* Level display */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Poziom przypomnienia
                </label>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  {levelLabel} (poziom {currentLevel})
                </div>
              </div>

              {/* Recipient email */}
              <div>
                <label
                  htmlFor="recipientEmail"
                  className="mb-1 block text-xs font-medium text-gray-400"
                >
                  Adres email odbiorcy
                </label>
                <input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500/60 focus:outline-none"
                />
              </div>

              {state?.error && (
                <p className="text-xs text-red-400">{state.error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Wysyłanie..." : "Wyślij przypomnienie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
