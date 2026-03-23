import { requireAdmin } from "@/lib/dal/auth";
import { getLeads } from "@/lib/dal/crm";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { LeadsContent } from "./_components/leads-content";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdmin();
  const { status, search } = await searchParams;

  const leads = await getLeads({
    status: status || undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <LeadsContent leads={leads} />
    </div>
  );
}
