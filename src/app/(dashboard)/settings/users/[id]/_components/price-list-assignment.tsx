"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { assignPriceListAction } from "@/lib/actions/price-lists";
import type { PriceListRow } from "@/types/price-lists";
import { cn } from "@/lib/utils";

interface PriceListAssignmentProps {
  userId: number;
  currentPriceListId: number | null;
  priceLists: PriceListRow[];
}

const selectClass = cn(
  "w-full h-10 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

export function PriceListAssignment({
  userId,
  currentPriceListId,
  priceLists,
}: PriceListAssignmentProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = React.useState<string>(
    currentPriceListId !== null ? String(currentPriceListId) : ""
  );

  function handleChange(value: string) {
    setSelectedId(value);
    startTransition(async () => {
      const result = await assignPriceListAction({
        userId,
        priceListId: value ? Number(value) : null,
      });
      if (result.error) {
        toast.error(result.error);
        // Revert optimistic update on error
        setSelectedId(currentPriceListId !== null ? String(currentPriceListId) : "");
      } else {
        toast.success(result.success ?? "Cennik przypisany");
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-aether-text-secondary">
        Przypisany cennik
      </label>
      <div className="flex items-center gap-3">
        <select
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isPending}
          className={selectClass}
        >
          <option value="">-- Brak cennika --</option>
          {priceLists.map((pl) => (
            <option key={pl.id} value={String(pl.id)}>
              {pl.code} — {pl.name}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="text-xs text-aether-text-muted animate-pulse">
            Zapisywanie...
          </span>
        )}
      </div>
      <p className="text-xs text-aether-text-muted">
        Wybrany cennik zostanie automatycznie zastosowany do wycen tego użytkownika.
      </p>
    </div>
  );
}
