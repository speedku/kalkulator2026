"use client";

import { useState, useTransition } from "react";
import { sendQuotationEmailAction } from "@/lib/actions/quotations";
import { toast } from "sonner";

interface Props {
  quotationId: number;
  defaultEmail?: string | null;
  onClose: () => void;
}

export function SendEmailDialog({ quotationId, defaultEmail, onClose }: Props) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!email.trim()) {
      setError("Adres email jest wymagany");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await sendQuotationEmailAction(quotationId, email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(result.success ?? "Email wysłany");
        onClose();
      }
    });
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-aether-surface border border-aether-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white/90">
            Wyślij wycenę emailem
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-400">
          PDF wyceny zostanie wysłany jako załącznik do podanego adresu email.
          Status wyceny zmieni się na &quot;Wysłana&quot;.
        </p>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Adres email odbiorcy
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isPending && handleSend()}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-aether-blue/50 focus:outline-none text-sm"
            placeholder="klient@firma.pl"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors disabled:opacity-60"
          >
            Anuluj
          </button>
          <button
            onClick={handleSend}
            disabled={isPending}
            className="px-5 py-2 rounded-lg bg-aether-blue hover:bg-aether-blue/90 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Wysyłanie..." : "Wyślij email"}
          </button>
        </div>
      </div>
    </div>
  );
}
