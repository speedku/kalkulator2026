"use client";

import { useState, useMemo } from "react";
import type { CartItem } from "@/types/quotations";
import type { BuilderProduct } from "@/lib/dal/products";

// Inline pricing formula — same as price-lists.ts calculateSalePrice
// salePrice = cost / (1 - marginPercent/100) — gross margin formula (NOT markup)
function calcSalePrice(cost: number, marginPercent: number): number {
  if (marginPercent >= 100 || cost <= 0) return cost;
  return Math.round((cost / (1 - marginPercent / 100)) * 100) / 100;
}

interface PriceListMargin {
  productGroupId: number;
  marginPercent: number;
}

interface Props {
  products: BuilderProduct[];
  userPriceList: { id: number; margins: PriceListMargin[] } | null;
  selectedPriceListId: number | null;
  cart: CartItem[];
  onAdd: (item: CartItem) => void;
  onRemove: (productId: number) => void;
  onUpdateQty: (productId: number, qty: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepProducts({
  products,
  userPriceList,
  cart,
  onAdd,
  onRemove,
  onUpdateQty,
  onBack,
  onNext,
}: Props) {
  const [search, setSearch] = useState("");

  // Build margin lookup from price list margins
  const marginMap = useMemo(() => {
    const map = new Map<number, number>();
    if (userPriceList) {
      userPriceList.margins.forEach((m) => map.set(m.productGroupId, m.marginPercent));
    }
    return map;
  }, [userPriceList]);

  const getPrice = (product: BuilderProduct): number => {
    const cost = product.purchasePrice ?? 0;
    if (cost <= 0) return 0;
    const margin =
      product.productGroupId ? (marginMap.get(product.productGroupId) ?? 0) : 0;
    return margin > 0 ? calcSalePrice(cost, margin) : cost;
  };

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const cartTotal = cart.reduce((sum, c) => sum + c.totalPrice, 0);
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white/90">Produkty</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product search */}
        <div className="space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj produktu po nazwie lub SKU..."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-aether-blue/50 focus:outline-none text-sm"
          />
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {filtered.slice(0, 50).map((p) => {
              const price = getPrice(p);
              const inCart = cart.some((c) => c.productId === p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-aether-blue/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{p.name}</p>
                    {p.sku && (
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm text-aether-blue/80 font-medium whitespace-nowrap">
                      {price > 0 ? formatCurrency(price) : "—"}
                    </span>
                    <button
                      onClick={() =>
                        onAdd({
                          productId: p.id,
                          sku: p.sku ?? "",
                          productName: p.name,
                          quantity: 1,
                          unitPrice: price,
                          totalPrice: price,
                        })
                      }
                      disabled={inCart}
                      className="px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-aether-blue/20 hover:bg-aether-blue/40 text-aether-blue border border-aether-blue/30"
                    >
                      {inCart ? "Dodano" : "+ Dodaj"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">Brak wyników</p>
            )}
            {filtered.length > 50 && (
              <p className="text-center text-gray-500 text-xs py-2">
                Wyświetlono 50 z {filtered.length} — zawęź wyszukiwanie
              </p>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-400">
              Koszyk ({cart.length})
            </h4>
            {cart.length > 0 && (
              <span className="text-sm font-semibold text-aether-blue/80">
                {formatCurrency(cartTotal)}
              </span>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Dodaj produkty z listy
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.unitPrice)} / szt.
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQty(item.productId, Math.max(1, Number(e.target.value)))
                    }
                    className="w-16 px-2 py-1 text-center rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
                  />
                  <span className="w-20 text-right text-sm text-white/80">
                    {formatCurrency(item.totalPrice)}
                  </span>
                  <button
                    onClick={() => onRemove(item.productId)}
                    className="text-red-400/60 hover:text-red-400 transition-colors text-xs ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
        >
          ← Wróć
        </button>
        <button
          onClick={onNext}
          disabled={cart.length === 0}
          className="px-6 py-2 rounded-lg bg-aether-blue hover:bg-aether-blue/90 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Dalej →
        </button>
      </div>
    </div>
  );
}
