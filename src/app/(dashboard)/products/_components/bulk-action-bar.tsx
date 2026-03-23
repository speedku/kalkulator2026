"use client";

import { bulkDeleteProductsAction } from "@/lib/actions/products";
import { GlowButton } from "@/components/aether/glow-button";
import { toast } from "sonner";

interface BulkActionBarProps {
  rowSelection: Record<string, boolean>;
  onClear: () => void;
}

export function BulkActionBar({ rowSelection, onClear }: BulkActionBarProps) {
  const selectedIds = Object.keys(rowSelection).map(Number);
  if (selectedIds.length === 0) return null;

  async function handleBulkDelete() {
    const result = await bulkDeleteProductsAction(selectedIds);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success ?? "Produkty zostały usunięte");
      onClear();
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-aether-surface backdrop-blur-xl border border-aether-border rounded-xl px-6 py-3 flex items-center gap-4 shadow-xl">
      <span className="text-sm text-aether-text">
        {selectedIds.length} zaznaczonych
      </span>
      <GlowButton variant="danger" onClick={handleBulkDelete}>
        Usuń zaznaczone
      </GlowButton>
      <button
        className="text-sm text-aether-text-muted hover:text-aether-text transition-colors"
        onClick={onClear}
      >
        Anuluj
      </button>
    </div>
  );
}
