import { requireAdmin } from "@/lib/dal/auth";
import { getCustomerById } from "@/lib/dal/crm";
import { getPriceLists } from "@/lib/dal/price-lists";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { CustomerForm } from "../_components/customer-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  converted: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  new: "Nowy",
  contacted: "Skontaktowany",
  qualified: "Zakwalifikowany",
  converted: "Przekonwertowany",
  lost: "Utracony",
};

const stageLabels: Record<string, string> = {
  prospecting: "Prospecting",
  proposal: "Oferta",
  negotiation: "Negocjacje",
  closed_won: "Zamknięty (wygrany)",
  closed_lost: "Zamknięty (przegrany)",
};

const stageColors: Record<string, string> = {
  prospecting: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  proposal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  negotiation: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  closed_won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed_lost: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [customer, priceLists] = await Promise.all([
    getCustomerById(Number(id)),
    getPriceLists(),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={customer.symbol ?? undefined}
        actions={
          <Link
            href={`/crm/${customer.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            Edytuj
          </Link>
        }
      />

      {/* Customer details card */}
      <GlassCard title="Dane kontaktowe" className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">Email</p>
            <p className="text-sm text-aether-text">{customer.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">Telefon</p>
            <p className="text-sm text-aether-text">{customer.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">NIP</p>
            <p className="text-sm font-mono text-aether-text">{customer.nip ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">Opiekun</p>
            <p className="text-sm text-aether-text">{customer.accountManager ?? "—"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">Adres</p>
            <p className="text-sm text-aether-text whitespace-pre-line">{customer.address ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">Ostatni kontakt</p>
            <p className="text-sm text-aether-text">
              {customer.lastContactAt ? format(new Date(customer.lastContactAt), "dd.MM.yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-aether-text-muted mb-1">Status</p>
            {customer.isActive ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                Aktywny
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
                Nieaktywny
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Leads */}
      <GlassCard title={`Leady (${customer.leads.length})`} className="px-6 py-6">
        {customer.leads.length === 0 ? (
          <p className="text-sm text-aether-text-muted mt-2">Brak leadów dla tego klienta</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-aether-border">
            <table className="w-full">
              <thead className="bg-aether-elevated">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Nazwa</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">Data</th>
                </tr>
              </thead>
              <tbody>
                {customer.leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-aether-border/50">
                    <td className="px-4 py-2 text-sm text-aether-text">{lead.name}</td>
                    <td className="px-4 py-2 text-sm text-aether-text-secondary">{lead.email ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[lead.status] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}>
                        {statusLabels[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-aether-text-secondary">
                      {format(new Date(lead.createdAt), "dd.MM.yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Deals */}
      <GlassCard title={`Deale (${customer.deals.length})`} className="px-6 py-6">
        {customer.deals.length === 0 ? (
          <p className="text-sm text-aether-text-muted mt-2">Brak dealów dla tego klienta</p>
        ) : (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customer.deals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-lg border border-aether-border bg-aether-elevated p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-aether-text">{deal.title}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${stageColors[deal.stage] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}>
                    {stageLabels[deal.stage] ?? deal.stage}
                  </span>
                </div>
                {deal.value != null && (
                  <p className="text-sm font-mono font-semibold text-aether-blue">
                    {deal.value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Edit form */}
      <GlassCard title="Edytuj klienta" className="px-6 py-6">
        <CustomerForm mode="edit" priceLists={priceLists} customer={customer} />
      </GlassCard>
    </div>
  );
}
