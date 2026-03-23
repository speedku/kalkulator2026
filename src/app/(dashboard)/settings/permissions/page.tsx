import { requireAdmin } from "@/lib/dal/auth";
import { getUsers } from "@/lib/dal/users";
import { getUserPermissions, getAvailablePages } from "@/lib/dal/permissions";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { PermissionsMatrix } from "./_components/permissions-matrix";

export const dynamic = "force-dynamic";

interface PermissionsPageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function PermissionsPage({
  searchParams,
}: PermissionsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const selectedUserId = params.userId ? Number(params.userId) : null;

  const [{ users }, availablePages] = await Promise.all([
    getUsers({ perPage: 200 }),
    getAvailablePages(),
  ]);

  const selectedUserPermissions = selectedUserId
    ? await getUserPermissions(selectedUserId)
    : null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Uprawnienia użytkowników"
        description="Zarządzaj dostępem do stron systemu dla każdego użytkownika"
      />
      <GlassCard>
        <div className="p-6">
          <PermissionsMatrix
            users={users}
            availablePages={availablePages}
            selectedUserId={selectedUserId}
            selectedUserPermissions={selectedUserPermissions}
          />
        </div>
      </GlassCard>
    </div>
  );
}
