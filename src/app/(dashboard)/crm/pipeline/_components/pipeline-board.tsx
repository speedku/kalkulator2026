"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateDealAction } from "@/lib/actions/crm";
import { cn } from "@/lib/utils";
import type { DealRow } from "@/lib/dal/crm";

interface PipelineBoardProps {
  stages: Record<string, DealRow[]>;
  stageTotals: Record<string, number>;
}

const STAGE_ORDER = ["prospecting", "proposal", "negotiation", "closed_won", "closed_lost"];

const stageLabels: Record<string, string> = {
  prospecting: "Prospecting",
  proposal: "Oferta",
  negotiation: "Negocjacje",
  closed_won: "Zamknięte (wygrane)",
  closed_lost: "Zamknięte (przegrane)",
};

const stageHeaderColors: Record<string, string> = {
  prospecting: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  proposal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  negotiation: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  closed_won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed_lost: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function formatValue(value: number): string {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface DealCardProps {
  deal: DealRow;
}

function DealCard({ deal }: DealCardProps) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [localStage, setLocalStage] = React.useState(deal.stage);

  async function handleStageChange(newStage: string) {
    const prevStage = localStage;
    setLocalStage(newStage);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("customerId", String(deal.customerId));
      formData.set("title", deal.title);
      formData.set("stage", newStage);
      if (deal.value != null) formData.set("value", String(deal.value));
      if (deal.notes) formData.set("notes", deal.notes);

      const result = await updateDealAction(deal.id, {}, formData);
      if (result.error) {
        // Revert on error
        setLocalStage(prevStage);
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-aether-border bg-aether-elevated p-3 space-y-2 hover:border-aether-border-glow transition-colors">
      <p className="text-sm font-medium text-aether-text leading-tight">{deal.title}</p>
      <p className="text-xs text-aether-text-muted">{deal.customerName}</p>
      {deal.value != null && (
        <p className="text-sm font-mono font-semibold text-aether-blue">
          {formatValue(deal.value)} PLN
        </p>
      )}
      <select
        value={localStage}
        onChange={(e) => handleStageChange(e.target.value)}
        className={cn(
          "w-full h-8 px-2 text-xs rounded-md",
          "bg-aether-surface border border-aether-border",
          "text-aether-text-secondary",
          "focus:outline-none focus:border-aether-border-glow",
          "transition-all duration-200 cursor-pointer"
        )}
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {stageLabels[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PipelineBoard({ stages, stageTotals }: PipelineBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGE_ORDER.map((stage) => {
        const deals = stages[stage] ?? [];
        const total = stageTotals[stage] ?? 0;

        return (
          <div
            key={stage}
            className="flex-shrink-0 w-72 flex flex-col gap-3"
          >
            {/* Stage header */}
            <div className="rounded-lg border border-aether-border bg-aether-surface p-3">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    stageHeaderColors[stage] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                  }`}
                >
                  {stageLabels[stage]}
                </span>
                <span className="text-xs text-aether-text-muted">
                  {deals.length} deal{deals.length !== 1 ? "i" : ""}
                </span>
              </div>
              {total > 0 && (
                <p className="text-sm font-mono font-semibold text-aether-text mt-1">
                  {formatValue(total)} PLN
                </p>
              )}
            </div>

            {/* Deal cards */}
            <div className="flex flex-col gap-2">
              {deals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-aether-border/50 p-4 text-center">
                  <p className="text-xs text-aether-text-muted">Brak dealów</p>
                </div>
              ) : (
                deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
