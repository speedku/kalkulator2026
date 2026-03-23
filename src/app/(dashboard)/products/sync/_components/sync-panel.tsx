"use client";
import { useState } from "react";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { toast } from "sonner";
import { syncProductsFromSubiektAction } from "@/lib/actions/products-sync";

interface SyncResult {
  synced: number;
  updated: number;
  errors: string[];
}

export function SyncPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncProductsFromSubiektAction();
      setResult(res);
      if (res.errors.length === 0) {
        toast.success(`Synchronizacja zakończona: ${res.synced} nowych, ${res.updated} zaktualizowanych`);
      } else {
        toast.warning(`Synchronizacja z ${res.errors.length} błędami`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd synchronizacji — sprawdź połączenie z Subiekt GT");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <div className="px-6 py-6 space-y-4">
        <p className="text-sm text-aether-text-muted">
          Łączy się z serwerem Subiekt GT ({process.env.NEXT_PUBLIC_SUBIEKT_SERVER ?? "10.0.0.115\\INSERTGT"})
          i synchronizuje wszystkie aktywne produkty (tw_Zablokowany = 0).
        </p>
        <GlowButton onClick={handleSync} disabled={loading}>
          {loading ? "Synchronizowanie..." : "Synchronizuj z Subiekt GT"}
        </GlowButton>

        {result && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-aether-text">Wyniki synchronizacji</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Nowe produkty", value: result.synced, color: "text-green-400" },
                { label: "Zaktualizowane", value: result.updated, color: "text-blue-400" },
                { label: "Błędy", value: result.errors.length, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-aether-text-muted">{label}</div>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-red-400 cursor-pointer">
                  {result.errors.length} błędów (kliknij aby rozwinąć)
                </summary>
                <ul className="mt-2 space-y-1 text-sm text-aether-text-muted font-mono text-xs">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
