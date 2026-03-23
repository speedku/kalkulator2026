import { GlassCard } from "@/components/aether/glass-card";
import type { DeadStockRow } from "@/types/analytics";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function DeadStockTable({ rows }: { rows: DeadStockRow[] }) {
  return (
    <GlassCard>
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-aether-text-secondary mb-1">Martwe zapasy</h3>
        <p className="text-xs text-aether-text-secondary mb-4">
          Produkty z ukończonych kontenerów (&gt;6 mies.) bez wycen w ostatnich 6 miesiącach
        </p>
        {rows.length === 0 ? (
          <p className="text-aether-text-secondary text-sm">Brak martwych zapasów — świetnie!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aether-border text-left text-xs text-aether-text-secondary">
                  <th className="pb-2 pr-4">SKU</th>
                  <th className="pb-2 pr-4">Nazwa</th>
                  <th className="pb-2 pr-4 text-right">Ilość</th>
                  <th className="pb-2 text-right">Data przyjazdu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-aether-border/40 hover:bg-white/[0.02]">
                    <td className="py-2 pr-4 font-mono text-xs text-aether-text-secondary">{row.sku}</td>
                    <td className="py-2 pr-4 text-aether-text">{row.name}</td>
                    <td className="py-2 pr-4 text-right text-aether-text">{row.quantity}</td>
                    <td className="py-2 text-right text-aether-text-secondary">
                      {row.arrivedAt ? format(row.arrivedAt, "dd MMM yyyy", { locale: pl }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
