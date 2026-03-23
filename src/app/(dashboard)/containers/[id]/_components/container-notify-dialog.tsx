"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { notifyContainerAction } from "@/lib/actions/containers";
import type { ContainerNotificationType } from "@/types/containers";

interface Props {
  containerId: number;
}

const NOTIFICATION_TYPE_LABELS: Record<ContainerNotificationType, string> = {
  eta_7days: "7 dni przed ETA",
  eta_3days: "3 dni przed ETA",
  eta_1day: "1 dzień przed ETA",
  arrived: "Przybycie",
  delayed: "Opóźnienie",
};

const NOTIFICATION_TYPES: ContainerNotificationType[] = [
  "eta_7days",
  "eta_3days",
  "eta_1day",
  "arrived",
  "delayed",
];

export function ContainerNotifyDialog({ containerId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [notificationType, setNotificationType] =
    useState<ContainerNotificationType>("arrived");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set("recipientEmail", recipientEmail);
    formData.set("notificationType", notificationType);

    startTransition(async () => {
      const result = await notifyContainerAction(containerId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Powiadomienie wysłane");
        setIsOpen(false);
        setRecipientEmail("");
        setNotificationType("arrived");
      }
    });
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-9 px-4 text-sm bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        Wyślij powiadomienie
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Wyślij powiadomienie o statusie kontenera"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-[#0d0d1a] shadow-2xl">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">
                Wyślij powiadomienie
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Powiadomi odbiorcę o statusie kontenera
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">
                  Adres email odbiorcy *
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  placeholder="odbiorca@firma.pl"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Typ powiadomienia *</label>
                <select
                  value={notificationType}
                  onChange={(e) =>
                    setNotificationType(e.target.value as ContainerNotificationType)
                  }
                  className={inputClass}
                >
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {NOTIFICATION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending || !recipientEmail}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Wysyłanie..." : "Wyślij"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 h-10 rounded-lg text-sm text-gray-400 border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
