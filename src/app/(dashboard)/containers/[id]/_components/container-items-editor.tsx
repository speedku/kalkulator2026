"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addContainerItemAction, removeContainerItemAction } from "@/lib/actions/containers";
import type { ContainerWithItems } from "@/types/containers";
import type { BuilderProduct } from "@/lib/dal/products";

interface Props {
  container: ContainerWithItems;
  products: BuilderProduct[];
}

interface AddItemState {
  productId: number | null;
  quantity: number;
  unitPrice: number;
  notes: string;
}

const INITIAL_ADD: AddItemState = {
  productId: null,
  quantity: 1,
  unitPrice: 0,
  notes: "",
};

const fmtUsd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

export function ContainerItemsEditor({ container, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddRow, setShowAddRow] = useState(false);
  const [addState, setAddState] = useState<AddItemState>(INITIAL_ADD);
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
      )
    : products.slice(0, 20);

  const totalQuantity = container.items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = container.items.reduce((s, i) => s + i.totalPrice, 0);

  const handleAdd = () => {
    if (!addState.productId || addState.quantity < 1 || addState.unitPrice <= 0) {
      toast.error("Wypełnij wszystkie wymagane pola pozycji");
      return;
    }

    const formData = new FormData();
    formData.set("productId", String(addState.productId));
    formData.set("quantity", String(addState.quantity));
    formData.set("unitPrice", String(addState.unitPrice));
    if (addState.notes) formData.set("notes", addState.notes);

    startTransition(async () => {
      const result = await addContainerItemAction(container.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Produkt dodany");
        setShowAddRow(false);
        setAddState(INITIAL_ADD);
        setProductSearch("");
        router.refresh();
      }
    });
  };

  const handleRemove = (itemId: number) => {
    startTransition(async () => {
      const result = await removeContainerItemAction(itemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Produkt usunięty");
        router.refresh();
      }
    });
  };

  const inputClass =
    "px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
          Pozycje kontenera ({container.items.length})
        </h3>
        {!showAddRow && (
          <button
            onClick={() => setShowAddRow(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-aether-blue/20 border border-aether-blue/30 text-aether-blue hover:bg-aether-blue/30 transition-colors disabled:opacity-50"
          >
            + Dodaj pozycję
          </button>
        )}
      </div>

      {/* Add row */}
      {showAddRow && (
        <div className="mb-4 p-4 rounded-lg border border-aether-blue/20 bg-aether-blue/5 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Nowa pozycja</p>

          {/* Product search */}
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Szukaj produktu po nazwie lub SKU..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none"
            />
            {productSearch && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-white/10 bg-[#0d0d1a] shadow-xl max-h-48 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500">Brak wyników</p>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAddState((prev) => ({
                          ...prev,
                          productId: p.id,
                          unitPrice: p.purchasePrice ?? 0,
                        }));
                        setProductSearch(p.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm text-white/90">{p.name}</p>
                        {p.sku && (
                          <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Ilość *</label>
              <input
                type="number"
                min={1}
                value={addState.quantity}
                onChange={(e) =>
                  setAddState((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                }
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Cena jedn. (USD) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={addState.unitPrice}
                onChange={(e) =>
                  setAddState((prev) => ({ ...prev, unitPrice: Number(e.target.value) }))
                }
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Uwagi</label>
              <input
                type="text"
                value={addState.notes}
                onChange={(e) =>
                  setAddState((prev) => ({ ...prev, notes: e.target.value }))
                }
                className={`${inputClass} w-full`}
                placeholder="Opcjonalne"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !addState.productId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-aether-blue text-white hover:bg-aether-blue/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Dodawanie..." : "Dodaj"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddRow(false);
                setAddState(INITIAL_ADD);
                setProductSearch("");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Items table */}
      {container.items.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
          Brak pozycji w kontenerze. Kliknij &quot;+ Dodaj pozycję&quot;.
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Produkt</th>
                <th className="px-4 py-3 font-medium text-right">Ilość</th>
                <th className="px-4 py-3 font-medium text-right">Cena jedn.</th>
                <th className="px-4 py-3 font-medium text-right">Wartość</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {container.items.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <p className="text-white/90">{item.product.name}</p>
                    {item.product.sku && (
                      <p className="text-xs text-gray-500 font-mono">{item.product.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">
                    {fmtUsd(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-white/90 font-medium font-mono text-xs">
                    {fmtUsd(item.totalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={isPending}
                      className="text-red-400/60 hover:text-red-400 transition-colors text-xs disabled:opacity-50"
                      aria-label="Usuń pozycję"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-white/5">
                <td className="px-4 py-3 text-xs text-gray-400">Razem</td>
                <td className="px-4 py-3 text-right text-white/80 font-medium">
                  {totalQuantity}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right text-aether-blue/90 font-semibold font-mono text-xs">
                  {fmtUsd(totalValue)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
