"use client";

import type { QuotationWithItems } from "@/types/quotations";

interface Props {
  quotation: QuotationWithItems;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Szkic",
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  accepted: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function QuotationDetail({ quotation }: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(d));

  const statusColor =
    STATUS_COLORS[quotation.status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs mb-1">Status</p>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {STATUS_LABELS[quotation.status] ?? quotation.status}
          </span>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">Data utworzenia</p>
          <p className="text-white/90">{fmtDate(quotation.createdAt)}</p>
        </div>
        {quotation.priceListName && (
          <div>
            <p className="text-gray-400 text-xs mb-1">Cennik</p>
            <p className="text-white/90">{quotation.priceListName}</p>
          </div>
        )}
        {quotation.creatorName && (
          <div>
            <p className="text-gray-400 text-xs mb-1">Utworzona przez</p>
            <p className="text-white/90">{quotation.creatorName}</p>
          </div>
        )}
      </div>

      {/* Customer section */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Dane klienta
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Nazwa</p>
            <p className="text-white/90">{quotation.customerName}</p>
          </div>
          {quotation.customerEmail && (
            <div>
              <p className="text-gray-400 text-xs mb-1">Email</p>
              <p className="text-white/90">{quotation.customerEmail}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Pozycje wyceny ({quotation.items.length})
        </h3>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Produkt</th>
                <th className="px-4 py-3 font-medium text-right">Ilość</th>
                <th className="px-4 py-3 font-medium text-right">Cena jedn.</th>
                <th className="px-4 py-3 font-medium text-right">Wartość</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <p className="text-white/90">{item.productName}</p>
                    {item.sku && (
                      <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {fmt(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-white/90 font-medium">
                    {fmt(item.totalPrice)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-white/20 bg-white/5">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right font-semibold text-white/90"
                >
                  RAZEM
                </td>
                <td className="px-4 py-3 text-right font-bold text-aether-blue/80 text-base">
                  {fmt(quotation.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
            Uwagi
          </h3>
          <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 px-4 py-3">
            {quotation.notes}
          </p>
        </div>
      )}
    </div>
  );
}
