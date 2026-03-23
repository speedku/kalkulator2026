import { GlassCard } from "@/components/aether/glass-card";
import type { UpcomingItem } from "@/types/dashboard";
import { Ship, Truck } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function UpcomingWidget({ items }: { items: UpcomingItem[] }) {
  return (
    <GlassCard>
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-aether-text-secondary mb-4">Nadchodzące (14 dni)</h3>
        {items.length === 0 ? (
          <p className="text-aether-text-secondary text-sm">Brak nadchodzących dostaw</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.03]">
                {item.type === "container" ? (
                  <Ship className="size-4 text-aether-blue shrink-0" />
                ) : (
                  <Truck className="size-4 text-aether-emerald shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-aether-text truncate">{item.label}</p>
                  <p className="text-xs text-aether-text-secondary">{item.status}</p>
                </div>
                <span className="text-xs text-aether-text-secondary shrink-0">
                  {format(item.etaDate, "dd MMM", { locale: pl })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
