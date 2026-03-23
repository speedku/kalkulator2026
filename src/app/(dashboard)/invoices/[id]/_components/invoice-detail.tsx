"use client";

import type { InvoiceWithItems } from "@/types/invoices";

interface Props {
  invoice: InvoiceWithItems;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Szkic",
  issued: "Wystawiona",
  paid: "Zapłacona",
  cancelled: "Anulowana",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  issued: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  paid: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function InvoiceDetail({ invoice }: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);
  const fmtDate = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("pl-PL", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(d))
      : "—";

  const statusColor =
    STATUS_COLORS[invoice.status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs mb-1">Status</p>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </span>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">Data wystawienia</p>
          <p className="text-white/90">{fmtDate(invoice.issuedAt)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">Termin płatności</p>
          <p className="text-white/90">{fmtDate(invoice.dueAt)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">Stawka VAT</p>
          <p className="text-white/90">{invoice.vatRate}%</p>
        </div>
        {invoice.creatorName && (
          <div>
            <p className="text-gray-400 text-xs mb-1">Wystawił</p>
            <p className="text-white/90">{invoice.creatorName}</p>
          </div>
        )}
        <div>
          <p className="text-gray-400 text-xs mb-1">Data utworzenia</p>
          <p className="text-white/90">{fmtDate(invoice.createdAt)}</p>
        </div>
      </div>

      {/* Customer section */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Nabywca
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Nazwa</p>
            <p className="text-white/90">{invoice.customerName}</p>
          </div>
          {invoice.customerNip && (
            <div>
              <p className="text-gray-400 text-xs mb-1">NIP</p>
              <p className="text-white/90 font-mono">{invoice.customerNip}</p>
            </div>
          )}
          {invoice.customerAddress && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-1">Adres</p>
              <p className="text-white/90">{invoice.customerAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Pozycje faktury ({invoice.items.length})
        </h3>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Produkt</th>
                <th className="px-4 py-3 font-medium text-right">Ilość</th>
                <th className="px-4 py-3 font-medium text-right">Cena netto</th>
                <th className="px-4 py-3 font-medium text-right">Wartość netto</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <p className="text-white/90">{item.productName}</p>
                    {item.sku && (
                      <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {fmt(item.unitNet)}
                  </td>
                  <td className="px-4 py-3 text-right text-white/90 font-medium">
                    {fmt(item.totalNet)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VAT summary */}
        <div className="flex justify-end mt-4">
          <div className="text-sm space-y-1 min-w-56">
            <div className="flex justify-between gap-8 text-gray-400">
              <span>Wartość netto:</span>
              <span className="text-white/80">{fmt(invoice.totalNet)}</span>
            </div>
            <div className="flex justify-between gap-8 text-gray-400">
              <span>VAT ({invoice.vatRate}%):</span>
              <span className="text-white/80">{fmt(invoice.totalVat)}</span>
            </div>
            <div className="flex justify-between gap-8 font-semibold border-t border-white/10 pt-1 mt-1">
              <span className="text-white/90">Do zapłaty:</span>
              <span className="text-aether-blue/90 text-base">{fmt(invoice.totalGross)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
            Uwagi
          </h3>
          <p className="text-white/80 text-sm bg-white/5 rounded-lg border border-white/10 px-4 py-3">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}
