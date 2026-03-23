import { requireAdmin } from "@/lib/dal/auth";
import { PageHeader } from "@/components/aether/page-header";
import { SyncPanel } from "./_components/sync-panel";

export default async function SyncPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Synchronizacja z Subiekt GT"
        description="Importuje produkty z bazy danych Subiekt GT (tw__Towar). Operacja tylko odczytu — nie usuwa lokalnych produktów."
      />
      <SyncPanel />
    </div>
  );
}
