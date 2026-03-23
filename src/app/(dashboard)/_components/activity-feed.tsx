import { GlassCard } from "@/components/aether/glass-card";
import type { ActivityEntry } from "@/types/dashboard";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <GlassCard>
      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-aether-text-secondary mb-4">Ostatnia aktywność</h3>
        {entries.length === 0 ? (
          <p className="text-aether-text-secondary text-sm">Brak aktywności</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-aether-blue/20 text-xs font-semibold text-aether-blue">
                  {entry.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-aether-text font-medium">{entry.user?.name ?? "System"}</span>
                  <span className="text-aether-text-secondary ml-1">{entry.action}</span>
                  {entry.entityType && (
                    <span className="text-aether-text-secondary ml-1">· {entry.entityType}</span>
                  )}
                </div>
                <span className="text-xs text-aether-text-secondary shrink-0">
                  {formatDistanceToNow(entry.createdAt, { addSuffix: true, locale: pl })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
