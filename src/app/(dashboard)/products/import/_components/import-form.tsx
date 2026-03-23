"use client";
import { useState } from "react";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { toast } from "sonner";

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  total: number;
}

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/import", { method: "POST", body: formData });
      const data = await res.json() as ImportResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Błąd importu");
      setResult(data);
      toast.success(`Import zakończony: ${data.imported} nowych, ${data.updated} zaktualizowanych`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd importu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <div className="px-6 py-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-aether-text mb-1">Plik Excel (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-aether-text"
            />
          </div>
          <GlowButton type="submit" disabled={!file || loading}>
            {loading ? "Importowanie..." : "Importuj produkty"}
          </GlowButton>
        </form>

        {result && (
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-aether-text">Wyniki importu</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Nowe", value: result.imported, color: "text-green-400" },
                { label: "Zaktualizowane", value: result.updated, color: "text-blue-400" },
                { label: "Pominięte", value: result.skipped, color: "text-yellow-400" },
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
                <ul className="mt-2 space-y-1 text-sm text-aether-text-muted">
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
