"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlassCard } from "@/components/aether/glass-card";
import { ContainerStatusBadge } from "../../_components/container-status-badge";
import { ContainerItemsEditor } from "./container-items-editor";
import { ContainerDocuments } from "./container-documents";
import { ContainerLabelsBtn } from "./container-labels-btn";
import { ContainerNotifyDialog } from "./container-notify-dialog";
import { updateContainerStatusAction } from "@/lib/actions/containers";
import type { ContainerWithItems } from "@/types/containers";
import type { BuilderProduct } from "@/lib/dal/products";

interface Props {
  container: ContainerWithItems;
  products: BuilderProduct[];
}

function useEtaCountdown(etaDate: Date) {
  const [diff, setDiff] = useState(() => etaDate.getTime() - Date.now());
  useEffect(() => {
    const timer = setInterval(() => setDiff(etaDate.getTime() - Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [etaDate]);
  if (diff <= 0) return { days: 0, hours: 0, overdue: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, overdue: false };
}

const STATUS_PIPELINE: Array<{
  key: string;
  label: string;
  next: string | null;
  prev: string | null;
}> = [
  { key: "in_transit", label: "W drodze", next: "at_port", prev: null },
  { key: "at_port", label: "W porcie", next: "unloaded", prev: "in_transit" },
  { key: "unloaded", label: "Rozładowany", next: "completed", prev: "at_port" },
  { key: "completed", label: "Gotowy", next: null, prev: "unloaded" },
];

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("pl-PL").format(new Date(d)) : "—";

const fmtUsd = (v: number | null) =>
  v !== null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
    : "—";

export function ContainerDetail({ container, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const eta = useEtaCountdown(new Date(container.etaDate));

  const currentStepIndex = STATUS_PIPELINE.findIndex(
    (s) => s.key === container.status
  );
  const currentStep = STATUS_PIPELINE[currentStepIndex];

  const handleStatusChange = (newStatus: string) => {
    const formData = new FormData();
    formData.set("status", newStatus);
    if (newStatus === "completed") {
      formData.set("actualArrivalDate", new Date().toISOString().split("T")[0]);
    }

    startTransition(async () => {
      const result = await updateContainerStatusAction(container.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Status zaktualizowany");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <ContainerStatusBadge status={container.status} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">ETA</p>
            <p className="text-white/90 text-sm font-medium">{fmtDate(container.etaDate)}</p>
            {eta.overdue ? (
              <p className="text-xs text-red-400 mt-0.5">Przeterminowany</p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                {eta.days}d {eta.hours}h pozostało
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">Wartość</p>
            <p className="text-white/90 text-sm font-mono">{fmtUsd(container.totalValue)}</p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-xs text-gray-400 mb-1">Pozycje</p>
            <p className="text-white/90 text-sm font-medium">
              {container.items.length} produktów
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Status pipeline */}
      <GlassCard>
        <div className="px-6 py-6">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
            Pipeline statusu
          </h3>
          <div className="flex items-center gap-2 mb-6">
            {STATUS_PIPELINE.map((step, idx) => {
              const isActive = step.key === container.status;
              const isPast = idx < currentStepIndex;
              return (
                <div key={step.key} className="flex items-center gap-2 flex-1">
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
                        isActive ? "text-aether-blue" : isPast ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STATUS_PIPELINE.length - 1 && (
                    <div
                      className={`h-px w-4 shrink-0 ${
                        idx < currentStepIndex ? "bg-green-500/50" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
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
          </div>
        </div>
      </GlassCard>

      {/* Details info */}
      <GlassCard>
        <div className="px-6 py-6">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
            Szczegóły kontenera
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Przewoźnik</p>
              <p className="text-white/90">{container.carrier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Port załadunku</p>
              <p className="text-white/90">{container.portOfOrigin}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Port docelowy</p>
              <p className="text-white/90">{container.portOfDestination}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Data załadunku</p>
              <p className="text-white/90">{fmtDate(container.shipmentDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">ETA</p>
              <p className="text-white/90">{fmtDate(container.etaDate)}</p>
            </div>
            {container.actualArrivalDate && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Data przybycia</p>
                <p className="text-white/90">{fmtDate(container.actualArrivalDate)}</p>
              </div>
            )}
          </div>
          {container.notes && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Uwagi</p>
              <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 px-3 py-2">
                {container.notes}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Items editor */}
      <GlassCard>
        <div className="px-6 py-6">
          <ContainerItemsEditor
            container={container}
            products={products}
          />
        </div>
      </GlassCard>

      {/* Documents */}
      <GlassCard>
        <div className="px-6 py-6">
          <ContainerDocuments container={container} />
        </div>
      </GlassCard>

      {/* Actions bar */}
      <GlassCard>
        <div className="px-6 py-6">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
            Akcje
          </h3>
          <div className="flex flex-wrap gap-3">
            <ContainerLabelsBtn items={container.items} />
            <ContainerNotifyDialog containerId={container.id} />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
