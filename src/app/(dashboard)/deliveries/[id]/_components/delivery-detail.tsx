"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlassCard } from "@/components/aether/glass-card";
import { DeliveryStatusBadge } from "../../_components/delivery-status-badge";
import { updateDomesticDeliveryStatusAction } from "@/lib/actions/domestic-deliveries";
import type { DomesticDeliveryWithDocuments } from "@/types/domestic-deliveries";

interface Props {
  delivery: DomesticDeliveryWithDocuments;
}

const STATUS_PIPELINE: Array<{
  key: string;
  label: string;
  next: string | null;
  prev: string | null;
}> = [
  { key: "pending", label: "Oczekuje", next: "in_transit", prev: null },
  { key: "in_transit", label: "W drodze", next: "delivered", prev: "pending" },
  { key: "delivered", label: "Dostarczona", next: null, prev: "in_transit" },
  { key: "cancelled", label: "Anulowana", next: null, prev: null },
];

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("pl-PL").format(new Date(d)) : "—";

export function DeliveryDetail({ delivery }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentStepIndex = STATUS_PIPELINE.findIndex(
    (s) => s.key === delivery.status
  );
  const currentStep = STATUS_PIPELINE[currentStepIndex];

  const handleStatusChange = (newStatus: string) => {
    const formData = new FormData();
    formData.set("status", newStatus);
    if (newStatus === "delivered") {
      formData.set("actualArrivalDate", new Date().toISOString().split("T")[0]);
    }

    startTransition(async () => {
      const result = await updateDomesticDeliveryStatusAction(
        delivery.id,
        formData
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Status zaktualizowany");
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    const formData = new FormData();
    formData.set("status", "cancelled");
    startTransition(async () => {
      const result = await updateDomesticDeliveryStatusAction(
        delivery.id,
        formData
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Dostawa anulowana");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">Planowana dostawa (ETA)</p>
            <p className="text-white/90 text-sm font-medium">
              {fmtDate(delivery.etaDate)}
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">
              {delivery.actualArrivalDate ? "Dostarczona" : "Dostawca"}
            </p>
            {delivery.actualArrivalDate ? (
              <p className="text-green-400 text-sm font-medium">
                {fmtDate(delivery.actualArrivalDate)}
              </p>
            ) : (
              <p className="text-white/90 text-sm">{delivery.supplier}</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Status pipeline */}
      {delivery.status !== "cancelled" && (
        <GlassCard>
          <div className="px-6 py-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
              Pipeline statusu
            </h3>
            <div className="flex items-center gap-2 mb-6">
              {STATUS_PIPELINE.filter((s) => s.key !== "cancelled").map(
                (step, idx, arr) => {
                  const isActive = step.key === delivery.status;
                  const isPast = idx < currentStepIndex;
                  return (
                    <div
                      key={step.key}
                      className="flex items-center gap-2 flex-1"
                    >
                      <div
                        className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          isActive
                            ? "border-aether-blue/50 bg-aether-blue/10"
                            : isPast
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isActive
                              ? "bg-aether-blue"
                              : isPast
                              ? "bg-green-500"
                              : "bg-white/20"
                          }`}
                        />
                        <span
                          className={`text-xs text-center ${
                            isActive
                              ? "text-aether-blue"
                              : isPast
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div
                          className={`h-px w-4 shrink-0 ${
                            idx < currentStepIndex
                              ? "bg-green-500/50"
                              : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* Status action buttons */}
            <div className="flex flex-wrap gap-2">
              {currentStep?.next && (
                <button
                  onClick={() => handleStatusChange(currentStep.next!)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-aether-blue/20 border border-aether-blue/30 text-aether-blue hover:bg-aether-blue/30 transition-colors disabled:opacity-50"
                >
                  Przejdź do:{" "}
                  {STATUS_PIPELINE.find((s) => s.key === currentStep.next)?.label}
                </button>
              )}
              {currentStep?.prev && (
                <button
                  onClick={() => handleStatusChange(currentStep.prev!)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cofnij do:{" "}
                  {STATUS_PIPELINE.find((s) => s.key === currentStep.prev)?.label}
                </button>
              )}
              {delivery.status !== "delivered" && (
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  Anuluj dostawę
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Details */}
      <GlassCard>
        <div className="px-6 py-6">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
            Szczegóły dostawy
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Nazwa</p>
              <p className="text-white/90">{delivery.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Dostawca</p>
              <p className="text-white/90">{delivery.supplier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">ETA</p>
              <p className="text-white/90">{fmtDate(delivery.etaDate)}</p>
            </div>
            {delivery.actualArrivalDate && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Data dostawy</p>
                <p className="text-green-400">{fmtDate(delivery.actualArrivalDate)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-1">Utworzono</p>
              <p className="text-gray-400 text-xs">{fmtDate(delivery.createdAt)}</p>
            </div>
          </div>
          {delivery.description && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Opis</p>
              <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 px-3 py-2">
                {delivery.description}
              </p>
            </div>
          )}
          {delivery.notes && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Uwagi</p>
              <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 px-3 py-2">
                {delivery.notes}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Documents */}
      {delivery.documents.length > 0 && (
        <GlassCard>
          <div className="px-6 py-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
              Dokumenty ({delivery.documents.length})
            </h3>
            <div className="space-y-2">
              {delivery.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div>
                    <p className="text-sm text-white/90">{doc.originalFilename}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {doc.documentType} · {fmtDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-aether-blue/70 hover:text-aether-blue transition-colors"
                  >
                    Pobierz →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
