"use client";

import { useState } from "react";
import type { ContainerItem } from "@/types/containers";

interface Props {
  items: ContainerItem[];
}

type LabelType = "jednostkowa" | "karton";

function generateChineseLabelHtml(items: ContainerItem[], labelType: LabelType): string {
  const labelCss = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, "Microsoft YaHei", sans-serif; background: white; }
      .label {
        width: 100mm;
        height: 70mm;
        border: 1px solid #000;
        padding: 4mm;
        page-break-after: always;
        page-break-inside: avoid;
        display: flex;
        flex-direction: column;
        gap: 2mm;
      }
      .label:last-child { page-break-after: auto; }
      .label-header { border-bottom: 1px solid #ccc; padding-bottom: 2mm; }
      .company { font-size: 8pt; color: #555; }
      .sku { font-size: 18pt; font-weight: bold; letter-spacing: 1px; line-height: 1.1; }
      .product-name { font-size: 10pt; flex: 1; }
      .meta { font-size: 8pt; color: #555; margin-top: auto; border-top: 1px solid #eee; padding-top: 1mm; display: flex; gap: 4mm; }
      @page { size: 100mm 70mm; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  `;

  const labelsHtml: string[] = [];

  for (const item of items) {
    const repeatCount = labelType === "jednostkowa" ? item.quantity : 1;
    for (let i = 0; i < repeatCount; i++) {
      labelsHtml.push(`
        <div class="label">
          <div class="label-header">
            <div class="company">ALLBAG Import</div>
          </div>
          <div class="sku">${item.product.sku ?? "—"}</div>
          <div class="product-name">${item.product.name}</div>
          <div class="meta">
            ${item.product.boxQuantity ? `<span>Karton: ${item.product.boxQuantity} szt.</span>` : ""}
            ${item.product.boxWeight ? `<span>Waga: ${item.product.boxWeight} kg</span>` : ""}
            <span>Ilość: ${item.quantity}</span>
          </div>
        </div>
      `);
    }
  }

  return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8" />${labelCss}</head><body>${labelsHtml.join("")}</body></html>`;
}

export function ContainerLabelsBtn({ items }: Props) {
  const [labelType, setLabelType] = useState<LabelType>("jednostkowa");

  const handlePrint = () => {
    if (items.length === 0) {
      alert("Brak pozycji w kontenerze — dodaj produkty przed drukowaniem etykiet");
      return;
    }

    const html = generateChineseLabelHtml(items, labelType);
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

  const totalLabels =
    labelType === "jednostkowa"
      ? items.reduce((s, i) => s + i.quantity, 0)
      : items.length;

  return (
    <div className="flex items-center gap-3">
      {/* Label type toggle */}
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        {(["jednostkowa", "karton"] as LabelType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setLabelType(type)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              labelType === type
                ? "bg-aether-blue/20 text-aether-blue"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {type === "jednostkowa" ? "Jednostkowe" : "Kartonowe"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-9 px-4 text-sm bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        Drukuj etykiety chińskie ({totalLabels})
      </button>
    </div>
  );
}
