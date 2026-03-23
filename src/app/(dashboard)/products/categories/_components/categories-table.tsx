"use client";

import * as React from "react";
import { useActionState } from "react";
import { GlassCard } from "@/components/aether/glass-card";
import { SubmitButton } from "@/components/aether/glow-button";
import {
  createCategoryAction,
  createProductGroupAction,
  type CategoryActionState,
} from "@/lib/actions/product-categories";
import type { ProductCategory, ProductGroup } from "@/types/products";
import { cn } from "@/lib/utils";

interface CategoriesTableProps {
  categories: ProductCategory[];
  groups: ProductGroup[];
}

const inputClass = cn(
  "h-9 px-3 text-sm rounded-lg flex-1",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

const initialState: CategoryActionState = {};

export function CategoriesTable({ categories, groups }: CategoriesTableProps) {
  const [categoryState, categoryAction] = useActionState(createCategoryAction, initialState);
  const [groupState, groupAction] = useActionState(createProductGroupAction, initialState);

  return (
    <div className="space-y-8">
      {/* Categories section */}
      <GlassCard title="Kategorie" description="Zarządzaj kategoriami produktów">
        <div className="px-6 pb-6 space-y-4">
          {/* Add category form */}
          <form action={categoryAction} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                name="name"
                type="text"
                placeholder="Nazwa kategorii"
                required
                className={inputClass}
              />
              <input
                name="slug"
                type="text"
                placeholder="slug-kategorii"
                required
                className={inputClass}
              />
              <SubmitButton size="sm">Dodaj</SubmitButton>
            </div>
            {categoryState.error && (
              <p className="text-xs text-red-400">{categoryState.error}</p>
            )}
            {categoryState.success && (
              <p className="text-xs text-green-400">{categoryState.success}</p>
            )}
          </form>

          {/* Categories table */}
          <div className="rounded-xl border border-aether-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-aether-elevated border-b border-aether-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Nazwa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Kolejność
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-aether-text-muted text-sm"
                    >
                      Brak kategorii
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b border-aether-border/50 hover:bg-aether-elevated/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-aether-text font-medium">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-aether-text-secondary font-mono">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3 text-sm text-aether-text-secondary">
                        {cat.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        {cat.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Aktywna
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Nieaktywna
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* Product Groups section */}
      <GlassCard title="Grupy produktów" description="Zarządzaj grupami produktów">
        <div className="px-6 pb-6 space-y-4">
          {/* Add group form */}
          <form action={groupAction} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                name="name"
                type="text"
                placeholder="Nazwa grupy produktów"
                required
                className={inputClass}
              />
              <SubmitButton size="sm">Dodaj</SubmitButton>
            </div>
            {groupState.error && (
              <p className="text-xs text-red-400">{groupState.error}</p>
            )}
            {groupState.success && (
              <p className="text-xs text-green-400">{groupState.success}</p>
            )}
          </form>

          {/* Groups table */}
          <div className="rounded-xl border border-aether-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-aether-elevated border-b border-aether-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Nazwa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Kolor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Kolejność
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-aether-text-muted text-sm"
                    >
                      Brak grup produktów
                    </td>
                  </tr>
                ) : (
                  groups.map((grp) => (
                    <tr
                      key={grp.id}
                      className="border-b border-aether-border/50 hover:bg-aether-elevated/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-aether-text font-medium">
                        {grp.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-aether-border"
                            style={{ backgroundColor: grp.backgroundColor }}
                          />
                          <span className="text-xs text-aether-text-secondary font-mono">
                            {grp.backgroundColor}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-aether-text-secondary">
                        {grp.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        {grp.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Aktywna
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Nieaktywna
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
