"use client";

import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";

interface LabelData {
  recipient: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  orderRef?: string;
}

function generateLabelHtml(labels: LabelData[]): string {
  const labelCss = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }
      .page { padding: 10mm; }
      .labels-grid { display: flex; flex-wrap: wrap; gap: 5mm; }
      .label {
        width: 105mm; height: 148mm;
        border: 1px solid #333;
        padding: 8mm;
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        gap: 4mm;
      }
      .sender { font-size: 9pt; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 3mm; }
      .sender strong { font-size: 10pt; color: #000; }
      .recipient { flex: 1; display: flex; flex-direction: column; justify-content: center; }
      .recipient-name { font-size: 13pt; font-weight: bold; margin-bottom: 2mm; }
      .recipient-address { font-size: 11pt; line-height: 1.5; }
      .barcode-area { border: 1px dashed #ccc; height: 20mm; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #888; }
      .ref { font-size: 8pt; color: #666; text-align: right; }
      @page { size: A4; margin: 0; }
      @media print { .no-print { display: none !important; } }
    </style>
  `;

  const labelsHtml = labels
    .map(
      (l) => `
    <div class="label">
      <div class="sender">
        <strong>ALLBAG</strong><br />
        ul. Przykładowa 1, 00-001 Warszawa<br />
        tel. +48 22 000 00 00
      </div>
      <div class="recipient">
        <div class="recipient-name">${l.recipient}</div>
        <div class="recipient-address">
          ${l.address}<br />
          ${l.postalCode} ${l.city}<br />
          ${l.phone ? `tel. ${l.phone}` : ""}
        </div>
      </div>
      <div class="barcode-area">Miejsce na kod kreskowy</div>
      ${l.orderRef ? `<div class="ref">Ref: ${l.orderRef}</div>` : ""}
    </div>
  `
    )
    .join("");

  return `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8" />${labelCss}</head><body><div class="page"><div class="labels-grid">${labelsHtml}</div></div></body></html>`;
}

// Sample labels for demonstration — real data from orders/invoices wired in Phase 7 (CRM)
const DEMO_LABELS: LabelData[] = [
  {
    recipient: "Jan Kowalski",
    address: "ul. Kwiatowa 15/3",
    city: "Kraków",
    postalCode: "30-001",
    phone: "+48 600 000 001",
    orderRef: "ZAM-2026-00001",
  },
  {
    recipient: "Firma XYZ Sp. z o.o.",
    address: "ul. Przemysłowa 42",
    city: "Wrocław",
    postalCode: "50-001",
    phone: "+48 71 000 00 02",
    orderRef: "ZAM-2026-00002",
  },
  {
    recipient: "Anna Nowak",
    address: "ul. Słoneczna 8",
    city: "Gdańsk",
    postalCode: "80-001",
    orderRef: "ZAM-2026-00003",
  },
  {
    recipient: "Sklep ABC",
    address: "al. Niepodległości 100",
    city: "Poznań",
    postalCode: "60-001",
    phone: "+48 61 000 00 04",
    orderRef: "ZAM-2026-00004",
  },
];

export function LabelsClient() {
  const handlePrint = () => {
    const html = generateLabelHtml(DEMO_LABELS);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Zablokowano popup — zezwól na popupy dla tej strony");
      return;
    }
    w.document.write(html);
    w.document.close();
    // Small delay for styles to load before print dialog
    setTimeout(() => {
      w.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etykiety wysyłkowe"
        description="Drukuj etykiety A6 na arkuszu A4"
      />
      <GlassCard>
        <div className="px-6 py-6 space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
            <div className="flex-1">
              <p className="text-sm text-indigo-300 font-medium mb-1">
                Etykiety wysyłkowe
              </p>
              <p className="text-sm text-gray-400">
                Wygeneruj arkusz A4 z etykietami A6 gotowymi do druku. Bieżąca wersja
                zawiera przykładowe dane demonstracyjne — pełna integracja z zamówieniami
                dostępna w kolejnej fazie.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <h3 className="text-sm font-medium text-white/80">
                Przykładowe etykiety ({DEMO_LABELS.length})
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {DEMO_LABELS.map((label, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-300 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90">{label.recipient}</p>
                    <p className="text-xs text-gray-500">
                      {label.address}, {label.postalCode} {label.city}
                    </p>
                  </div>
                  {label.orderRef && (
                    <span className="ml-auto text-xs text-gray-500 shrink-0">
                      {label.orderRef}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-6 text-sm bg-aether-blue text-white hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
            >
              Drukuj etykiety ({DEMO_LABELS.length})
            </button>
            <p className="text-xs text-gray-500">
              Otworzy nową kartę z podglądem wydruku
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
