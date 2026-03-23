import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { differenceInDays } from "date-fns";
import { requireAdmin } from "@/lib/dal/auth";
import { getWindykacjaCase } from "@/lib/dal/windykacja";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { CaseStatusBadge } from "../_components/case-status-badge";
import { SendReminderDialog } from "../_components/send-reminder-dialog";
import { CaseDetailActions } from "./_components/case-detail-actions";

function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function WindykacjaCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  await requireAdmin();
  const { caseId } = await params;
  const windykacjaCase = await getWindykacjaCase(Number(caseId));

  if (!windykacjaCase) {
    notFound();
  }

  const invoice = windykacjaCase.invoice;
  const daysOverdue = invoice.dueAt
    ? differenceInDays(new Date(), invoice.dueAt)
    : 0;

  const lastLog = windykacjaCase.reminderLogs[0];
  const nextLevel = lastLog ? Math.min(lastLog.level + 1, 4) : 1;

  const priorityLabels: Record<string, string> = {
    low: "Niski",
    normal: "Normalny",
    high: "Wysoki",
    urgent: "Pilny",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sprawa: ${invoice.invoiceNumber}`}
        description={`Windykacja faktury — ${invoice.customerName}`}
        actions={
          <Link
            href="/windykacja"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Powrót do windykacji
          </Link>
        }
      />

      {/* Invoice details */}
      <GlassCard className="px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          Szczegóły faktury
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-gray-400">Numer faktury</dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {invoice.invoiceNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Klient</dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {invoice.customerName}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Kwota brutto</dt>
            <dd className="mt-1 text-sm font-bold text-red-400">
              {formatPLN(invoice.totalGross)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Termin płatności</dt>
            <dd className="mt-1 text-sm text-white">
              {invoice.dueAt
                ? format(invoice.dueAt, "dd.MM.yyyy", { locale: pl })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Dni po terminie</dt>
            <dd className="mt-1 text-sm font-bold text-red-400">
              {daysOverdue} dni
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Status faktury</dt>
            <dd className="mt-1 text-sm text-gray-300">{invoice.status}</dd>
          </div>
        </dl>
      </GlassCard>

      {/* Case management */}
      <GlassCard className="px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          Zarządzanie sprawą
        </h2>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">Status sprawy</p>
              <CaseStatusBadge status={windykacjaCase.status} />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">Priorytet</p>
              <span className="text-sm text-gray-300">
                {priorityLabels[windykacjaCase.priority] ??
                  windykacjaCase.priority}
              </span>
            </div>
            {windykacjaCase.notes && (
              <div className="w-full">
                <p className="mb-1 text-xs text-gray-400">Notatki</p>
                <p className="text-sm text-gray-300">{windykacjaCase.notes}</p>
              </div>
            )}
          </div>

          {/* Status update form (client component) */}
          <CaseDetailActions
            caseId={windykacjaCase.id}
            currentStatus={windykacjaCase.status}
          />

          {/* PDF download */}
          <div className="pt-2">
            <a
              href={`/kalkulator2026/api/windykacja/pdf/${invoice.id}`}
              download={`wezwanie-${invoice.invoiceNumber}.pdf`}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              Pobierz PDF wezwania
            </a>
          </div>
        </div>
      </GlassCard>

      {/* Reminder history */}
      <GlassCard className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Historia przypomnień
          </h2>
          <SendReminderDialog
            caseId={windykacjaCase.id}
            currentLevel={nextLevel}
            invoiceNumber={invoice.invoiceNumber}
            recipientEmail=""
          />
        </div>

        {windykacjaCase.reminderLogs.length === 0 ? (
          <p className="text-sm text-gray-400">Nie wysłano jeszcze żadnych przypomnień.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Poziom
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Wysłano
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Odbiorca
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {windykacjaCase.reminderLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-3 py-2 text-gray-300">
                      Poziom {log.level}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {format(log.sentAt, "dd.MM.yyyy HH:mm", { locale: pl })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">
                      {log.recipientEmail}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.status === "sent"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {log.status === "sent" ? "Wysłano" : "Błąd"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
