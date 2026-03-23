import { GlassCard } from "@/components/aether/glass-card";
import type { TopProductRow } from "@/types/analytics";

export function TopProductsTable({ rows }: { rows: TopProductRow[] }) {
  return (
    <GlassCard>
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-aether-text-secondary mb-4">Top 10 produktów (przyjęte wyceny, 12 miesięcy)</h3>
        {rows.length === 0 ? (
          <p className="text-aether-text-secondary text-sm">Brak danych</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aether-border text-left text-xs text-aether-text-secondary">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">SKU</th>
                  <th className="pb-2 pr-4">Nazwa</th>
                  <th className="pb-2 pr-4 text-right">Przychód</th>
                  <th className="pb-2 text-right">Ilość</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.sku} className="border-b border-aether-border/40 hover:bg-white/[0.02]">
                    <td className="py-2 pr-4 text-aether-text-secondary">{i + 1}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-aether-text-secondary">{row.sku}</td>
                    <td className="py-2 pr-4 text-aether-text">{row.name}</td>
                    <td className="py-2 pr-4 text-right text-aether-text">
                      {row.revenue.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł
                    </td>
                    <td className="py-2 text-right text-aether-text-secondary">{row.quantity}</td>
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
