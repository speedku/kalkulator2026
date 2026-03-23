"use client";

import type { CartItem } from "@/types/quotations";

interface Props {
  customerName: string;
  customerEmail: string;
  cart: CartItem[];
  notes: string;
  onNotesChange: (n: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepSummary({
  customerName,
  customerEmail,
  cart,
  notes,
  onNotesChange,
  onBack,
  onSubmit,
  isSubmitting,
}: Props) {
  const total = cart.reduce((s, c) => s + c.totalPrice, 0);
  const fmt = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

  return (
    <div className="space-y-5 max-w-2xl">
      <h3 className="text-base font-semibold text-white/90">Podsumowanie</h3>

      {/* Customer info */}
      <div className="grid grid-cols-2 gap-4 text-sm rounded-lg bg-white/5 border border-white/10 px-4 py-3">
        <div>
          <span className="text-gray-400">Klient: </span>
          <span className="text-white/90">{customerName}</span>
        </div>
        {customerEmail && (
          <div>
            <span className="text-gray-400">Email: </span>
            <span className="text-white/90">{customerEmail}</span>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="rounded-lg overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-left">
              <th className="px-3 py-2 font-medium">Produkt</th>
              <th className="px-3 py-2 font-medium text-right">Ilość</th>
              <th className="px-3 py-2 font-medium text-right">Cena jedn.</th>
              <th className="px-3 py-2 font-medium text-right">Wartość</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.productId} className="border-t border-white/5">
                <td className="px-3 py-2 text-white/90">{item.productName}</td>
                <td className="px-3 py-2 text-right text-gray-300">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-gray-300">
                  {fmt(item.unitPrice)}
                </td>
                <td className="px-3 py-2 text-right text-white/90">
                  {fmt(item.totalPrice)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-white/20 bg-white/5">
              <td colSpan={3} className="px-3 py-2 text-right font-semibold text-white/90">
                RAZEM
              </td>
              <td className="px-3 py-2 text-right font-bold text-aether-blue/80">
                {fmt(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Uwagi (opcjonalne)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-aether-blue/50 focus:outline-none text-sm resize-none"
          placeholder="Dodatkowe informacje dla klienta..."
        />
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors disabled:opacity-60"
        >
          ← Wróć
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-aether-blue hover:bg-aether-blue/90 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? "Zapisywanie..." : "Zapisz wycenę"}
        </button>
      </div>
    </div>
  );
}
