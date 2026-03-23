"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createInvoiceAction } from "@/lib/actions/invoices";
import type { BuilderProduct } from "@/lib/dal/products";

interface LineItem {
  productId: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
  unitNet: number;
  totalNet: number;
}

interface Props {
  products: BuilderProduct[];
}

const VAT_RATES = [23, 8, 5, 0];

const INITIAL_STATE = { error: undefined, success: undefined, invoiceId: undefined };

export function InvoiceForm({ products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [vatRate, setVatRate] = useState(23);

  // Computed totals
  const totalNet = items.reduce((s, i) => s + i.totalNet, 0);
  const totalVat = Math.round(totalNet * (vatRate / 100) * 100) / 100;
  const totalGross = Math.round((totalNet + totalVat) * 100) / 100;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
      )
    : products.slice(0, 20);

  const addItem = (product: BuilderProduct) => {
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitNet: product.purchasePrice ?? 0,
        totalNet: product.purchasePrice ?? 0,
      },
    ]);
    setProductSearch("");
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitNet") {
          updated.totalNet =
            Math.round(
              (field === "quantity" ? Number(value) : item.quantity) *
                (field === "unitNet" ? Number(value) : item.unitNet) *
                100
            ) / 100;
        }
        return updated;
      })
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Dodaj przynajmniej jedną pozycję");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("vatRate", String(vatRate));
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await createInvoiceAction(INITIAL_STATE, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Faktura utworzona");
        if (result.invoiceId) {
          router.push(`/invoices/${result.invoiceId}`);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer section */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Dane nabywcy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Nazwa klienta *</label>
            <input
              type="text"
              name="customerName"
              required
              placeholder="Nazwa firmy lub imię i nazwisko"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">NIP</label>
            <input
              type="text"
              name="customerNip"
              placeholder="0000000000"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-gray-400">Adres</label>
            <input
              type="text"
              name="customerAddress"
              placeholder="ul. Przykładowa 1, 00-001 Warszawa"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Invoice details */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Szczegóły faktury
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Stawka VAT</label>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none"
            >
              {VAT_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Data wystawienia</label>
            <input
              type="date"
              name="issuedAt"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Termin płatności</label>
            <input
              type="date"
              name="dueAt"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Pozycje faktury
        </h3>

        {/* Product search */}
        <div className="mb-3 relative">
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
                    onClick={() => addItem(p)}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm text-white/90">{p.name}</p>
                      {p.sku && (
                        <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                      )}
                    </div>
                    {p.purchasePrice !== null && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Intl.NumberFormat("pl-PL", {
                          style: "currency",
                          currency: "PLN",
                        }).format(p.purchasePrice)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="rounded-lg overflow-hidden border border-white/10 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-left">
                  <th className="px-3 py-2 font-medium">Produkt</th>
                  <th className="px-3 py-2 font-medium text-right w-20">Ilość</th>
                  <th className="px-3 py-2 font-medium text-right w-28">Cena netto</th>
                  <th className="px-3 py-2 font-medium text-right w-28">Wartość netto</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-3 py-2">
                      <p className="text-white/90">{item.productName}</p>
                      {item.sku && (
                        <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm text-right focus:border-aether-blue/50 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitNet}
                        onChange={(e) => updateItem(i, "unitNet", Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm text-right focus:border-aether-blue/50 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-white/80 font-medium">
                      {fmt(item.totalNet)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-red-400/60 hover:text-red-400 transition-colors text-xs"
                        aria-label="Usuń pozycję"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
            Szukaj produktu powyżej aby dodać pozycje do faktury
          </div>
        )}

        {/* VAT preview */}
        {items.length > 0 && (
          <div className="flex justify-end">
            <div className="text-sm space-y-1 min-w-48">
              <div className="flex justify-between gap-8 text-gray-400">
                <span>Wartość netto:</span>
                <span className="text-white/80">{fmt(totalNet)}</span>
              </div>
              <div className="flex justify-between gap-8 text-gray-400">
                <span>VAT ({vatRate}%):</span>
                <span className="text-white/80">{fmt(totalVat)}</span>
              </div>
              <div className="flex justify-between gap-8 font-semibold border-t border-white/10 pt-1 mt-1">
                <span className="text-white/90">Do zapłaty:</span>
                <span className="text-aether-blue/90">{fmt(totalGross)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Uwagi</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Opcjonalne uwagi do faktury..."
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || items.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-6 text-sm bg-aether-blue text-white hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Tworzenie..." : "Utwórz fakturę"}
        </button>
        <Link
          href="/invoices"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Anuluj
        </Link>
      </div>
    </form>
  );
}
