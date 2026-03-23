import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Witaj w Kalkulator 2026"
      />

      <GlassCard className="p-6">
        <p className="text-aether-text-secondary">
          Dashboard zostanie zbudowany w Phase 6. Aktualnie dostępne są podstawowe
          funkcje systemu: zarządzanie użytkownikami, uprawnienia, kody dostępu i
          notatnik.
        </p>
      </GlassCard>
    </div>
  );
}
