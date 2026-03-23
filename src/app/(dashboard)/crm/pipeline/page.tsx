import { requireAdmin } from "@/lib/dal/auth";
import { getDeals } from "@/lib/dal/crm";
import { PageHeader } from "@/components/aether/page-header";
import { PipelineBoard } from "./_components/pipeline-board";
import type { DealRow } from "@/lib/dal/crm";

const STAGE_ORDER = ["prospecting", "proposal", "negotiation", "closed_won", "closed_lost"];

export default async function PipelinePage() {
  await requireAdmin();
  const deals = await getDeals();

  // Group deals by stage on the server
  const stagesMap: Record<string, DealRow[]> = {};
  const stageTotals: Record<string, number> = {};

  for (const stage of STAGE_ORDER) {
    stagesMap[stage] = [];
    stageTotals[stage] = 0;
  }

  for (const deal of deals) {
    const stage = deal.stage;
    if (!stagesMap[stage]) {
      stagesMap[stage] = [];
      stageTotals[stage] = 0;
    }
    stagesMap[stage].push(deal);
    stageTotals[stage] += deal.value ?? 0;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline sprzedażowy"
        description={`${deals.length} dealów łącznie`}
      />
      <PipelineBoard stages={stagesMap} stageTotals={stageTotals} />
    </div>
  );
}
