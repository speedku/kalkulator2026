"use client";

import * as React from "react";
import { useRef } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import { batchUpsertMarginsAction } from "@/lib/actions/price-lists";
import { GlowButton } from "@/components/aether/glow-button";
import type { MarginMatrixEntry } from "@/types/price-lists";
import { cn } from "@/lib/utils";

interface ProductGroupBasic {
  id: number;
  name: string;
}

interface MarginMatrixEditorProps {
  priceListId: number;
  productGroups: ProductGroupBasic[];
  existingMargins: MarginMatrixEntry[];
}

type MatrixStore = {
  edits: Record<string, string>; // key: groupId string, value: input string (empty = not set)
  isDirty: boolean;
  setMargin: (groupId: number, value: string) => void;
  markClean: () => void;
};

function createMatrixStore(initial: Record<string, string>) {
  return create<MatrixStore>((set) => ({
    edits: initial,
    isDirty: false,
    setMargin: (groupId, value) =>
      set((s) => ({
        edits: { ...s.edits, [String(groupId)]: value },
        isDirty: true,
      })),
    markClean: () => set({ isDirty: false }),
  }));
}

type MatrixStoreApi = ReturnType<typeof createMatrixStore>;

const inputClass = cn(
  "w-28 h-9 px-3 text-sm rounded-lg text-right font-mono",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

function MatrixRow({
  group,
  store,
}: {
  group: ProductGroupBasic;
  store: MatrixStoreApi;
}) {
  const edits = store((s) => s.edits);
  const setMargin = store((s) => s.setMargin);
  const value = edits[String(group.id)] ?? "";

  // Compute a sample multiplier for display
  const numVal = parseFloat(value);
  const multiplier =
    !isNaN(numVal) && numVal >= 0 && numVal < 100
      ? (1 / (1 - numVal / 100)).toFixed(2)
      : null;

  return (
    <tr className="border-b border-aether-border/50 hover:bg-aether-elevated/30 transition-colors">
      <td className="px-4 py-3 text-sm text-aether-text">{group.name}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-end">
          <input
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            value={value}
            placeholder="—"
            className={inputClass}
            onChange={(e) => setMargin(group.id, e.target.value)}
          />
          <span className="text-xs text-aether-text-muted w-4">%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {multiplier !== null ? (
          <span className="text-xs font-mono text-aether-text-secondary">
            ×{multiplier}
          </span>
        ) : (
          <span className="text-xs text-aether-text-muted">—</span>
        )}
      </td>
    </tr>
  );
}

function MatrixEditorInner({
  priceListId,
  productGroups,
  store,
}: {
  priceListId: number;
  productGroups: ProductGroupBasic[];
  store: MatrixStoreApi;
}) {
  const isDirty = store((s) => s.isDirty);
  const edits = store((s) => s.edits);
  const markClean = store((s) => s.markClean);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    // Collect only entries that have a valid numeric value
    const margins: { productGroupId: number; marginPercent: number }[] = [];
    for (const group of productGroups) {
      const raw = edits[String(group.id)];
      if (raw === undefined || raw === "") continue;
      const num = parseFloat(raw);
      if (isNaN(num) || num < 0 || num >= 100) {
        toast.error(`Nieprawidłowa marża dla grupy "${group.name}" — wymagana wartość 0–99.99`);
        return;
      }
      margins.push({ productGroupId: group.id, marginPercent: num });
    }

    if (margins.length === 0) {
      toast.error("Brak marż do zapisania");
      return;
    }

    setIsSaving(true);
    const result = await batchUpsertMarginsAction({
      priceListId,
      margins,
    });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success ?? `Zapisano marże`);
      markClean();
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="rounded-xl border border-aether-border overflow-hidden bg-aether-surface">
        <table className="w-full">
          <thead>
            <tr className="bg-aether-elevated border-b border-aether-border">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                Grupa produktowa
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                Marża (%)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                Mnożnik
              </th>
            </tr>
          </thead>
          <tbody>
            {productGroups.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-aether-text-muted text-sm">
                  Brak aktywnych grup produktowych
                </td>
              </tr>
            ) : (
              productGroups.map((group) => (
                <MatrixRow key={group.id} group={group} store={store} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {productGroups.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <GlowButton
            onClick={handleSave}
            loading={isSaving}
            disabled={!isDirty}
          >
            Zapisz marże
          </GlowButton>
          {isDirty && (
            <span className="text-xs text-aether-text-muted">
              Masz niezapisane zmiany
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function MarginMatrixEditor({
  priceListId,
  productGroups,
  existingMargins,
}: MarginMatrixEditorProps) {
  // Build initial edits from existingMargins — empty string for groups without margin
  const initialEdits: Record<string, string> = {};
  for (const m of existingMargins) {
    initialEdits[String(m.productGroupId)] = String(m.marginPercent);
  }

  // Page-scoped Zustand store via useRef — does NOT leak between navigations
  const storeRef = useRef<MatrixStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createMatrixStore(initialEdits);
  }
  const store = storeRef.current;

  return (
    <MatrixEditorInner
      priceListId={priceListId}
      productGroups={productGroups}
      store={store}
    />
  );
}
