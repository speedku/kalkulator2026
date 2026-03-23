"use client";

import * as React from "react";
import { format } from "date-fns";
import { deleteBrandWatchItemAction } from "@/lib/actions/crm";
import { GlowButton } from "@/components/aether/glow-button";
import { BrandWatchForm } from "./brand-watch-form";
import type { BrandWatchRow } from "@/lib/dal/crm";

interface BrandWatchTableProps {
  items: BrandWatchRow[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  flagged: "bg-red-500/20 text-red-400 border-red-500/30",
  resolved: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Aktywny",
  flagged: "Oflagowany",
  resolved: "Rozwiązany",
};

const marketplaceColors: Record<string, string> = {
  allegro: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  amazon: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ebay: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function BrandWatchTable({ items }: BrandWatchTableProps) {
  const [editingItem, setEditingItem] = React.useState<BrandWatchRow | null>(null);

  async function handleDelete(id: number, url: string) {
    if (!confirm(`Czy na pewno chcesz usunąć pozycję "${url}"?`)) return;
    const result = await deleteBrandWatchItemAction(id);
    if (result.error) {
      alert(result.error);
    }
  }

  return (
    <>
      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl">
            <BrandWatchForm
              mode="edit"
              item={editingItem}
              onClose={() => setEditingItem(null)}
              onSuccess={() => setEditingItem(null)}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-aether-text-muted py-8 text-center">
          Brak pozycji w monitoringu marki
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-aether-border">
          <table className="w-full">
            <thead className="bg-aether-elevated border-b border-aether-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">URL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Marketplace</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Ostatni check</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Notatki</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const urlDisplay = item.url.length > 50 ? `${item.url.slice(0, 50)}...` : item.url;
                const mpKey = item.marketplace.toLowerCase();
                const mpColorClass = marketplaceColors[mpKey] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";

                return (
                  <tr
                    key={item.id}
                    className="border-t border-aether-border/50 hover:bg-aether-elevated/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm max-w-[200px]">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aether-blue hover:underline truncate block font-mono text-xs"
                        title={item.url}
                      >
                        {urlDisplay}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${mpColorClass}`}>
                        {item.marketplace}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-aether-text-secondary">
                      {item.productSku ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[item.status] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-aether-text-secondary">
                      {item.lastChecked ? format(new Date(item.lastChecked), "dd.MM.yyyy") : "Nie sprawdzono"}
                    </td>
                    <td className="px-4 py-3 text-sm text-aether-text-secondary max-w-[150px]">
                      <span className="truncate block" title={item.notes ?? ""}>
                        {item.notes ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <GlowButton
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          Edytuj
                        </GlowButton>
                        <GlowButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.url)}
                        >
                          Usuń
                        </GlowButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
