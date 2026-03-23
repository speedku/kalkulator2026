import { requireAdmin } from "@/lib/dal/auth";
import { getActivityLog } from "@/lib/dal/activity-log";
import { getUsers } from "@/lib/dal/users";
import { PageHeader } from "@/components/aether/page-header";
import { AuditLogTable } from "./_components/audit-log-table";

export const dynamic = "force-dynamic";

interface AuditLogPageProps {
  searchParams: Promise<{
    activityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

const ACTIVITY_TYPES = [
  "product",
  "container",
  "sync",
  "delivery",
  "auth",
  "system",
  "quotation",
  "user",
];

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const activityType = params.activityType ?? "";
  const userId = params.userId ? Number(params.userId) : undefined;
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

  const [{ entries, total, perPage }, { users }] = await Promise.all([
    getActivityLog({
      activityType: activityType || undefined,
      userId,
      dateFrom,
      dateTo,
      page,
      perPage: 50,
    }),
    getUsers({ perPage: 200 }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Log aktywności"
        description="Przeglądaj historię wszystkich działań w systemie"
      />
      <AuditLogTable
        entries={entries}
        total={total}
        page={page}
        perPage={perPage}
        users={users}
        activityTypes={ACTIVITY_TYPES}
        filters={{ activityType, userId: params.userId ?? "", dateFrom: params.dateFrom ?? "", dateTo: params.dateTo ?? "" }}
      />
    </div>
  );
}
