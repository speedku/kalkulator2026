"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { deletePriceListAction } from "@/lib/actions/price-lists";
import { GlowButton } from "@/components/aether/glow-button";
import type { PriceListRow } from "@/types/price-lists";
import { cn } from "@/lib/utils";

interface PriceListsTableProps {
  data: PriceListRow[];
}

export function PriceListsTable({ data }: PriceListsTableProps) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć cennik "${name}"? Ta operacja jest nieodwracalna.`)) {
      return;
    }
    setDeletingId(id);
    const result = await deletePriceListAction(id);
    setDeletingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success ?? "Cennik usunięty");
    }
  }

  return (
    <div className="rounded-xl border border-aether-border overflow-hidden bg-aether-surface backdrop-blur-xl">
      <table className="w-full">
        <thead>
          <tr className="bg-aether-elevated border-b border-aether-border">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
              Kod
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
              Nazwa
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
              Kolejność
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
              Utworzony
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-aether-text-muted">
                Brak cenników — utwórz pierwszy cennik
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className="border-b border-aether-border/50 hover:bg-aether-elevated/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-aether-text-secondary">
                    {row.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-aether-text font-medium">
                  {row.name}
                </td>
                <td className="px-4 py-3">
                  {row.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Aktywny
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      Nieaktywny
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-aether-text-secondary">
                  {row.displayOrder}
                </td>
                <td className="px-4 py-3 text-sm text-aether-text-secondary">
                  {new Date(row.createdAt).toLocaleDateString("pl-PL")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/price-lists/${row.id}`}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-8 px-3 text-sm",
                        "bg-transparent text-aether-text border border-aether-border hover:border-aether-border-glow hover:shadow-glow-sm"
                      )}
                    >
                      Edytuj
                    </Link>
                    <GlowButton
                      variant="danger"
                      size="sm"
                      loading={deletingId === row.id}
                      onClick={() => handleDelete(row.id, row.name)}
                    >
                      Usuń
                    </GlowButton>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
