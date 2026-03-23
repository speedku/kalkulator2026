import { requireAdmin } from "@/lib/dal/auth";
import { getUsers } from "@/lib/dal/users";
import { PageHeader } from "@/components/aether/page-header";
import { StatCard } from "@/components/aether/stat-card";
import { UsersTable } from "./_components/users-table";
import { CreateUserDialog } from "./_components/create-user-dialog";
import { Users, UserCheck, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface UsersPageProps {
  searchParams: Promise<{ search?: string; page?: string; role?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const search = params.search ?? "";
  const role = params.role ?? "";

  const { users, total, perPage } = await getUsers({
    search: search || undefined,
    page,
    perPage: 20,
    role: role || undefined,
  });

  // Stats
  const allUsers = await getUsers({ perPage: 9999 });
  const activeCount = allUsers.users.filter((u) => u.isActive).length;
  const adminCount = allUsers.users.filter((u) => u.role === "admin").length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Zarządzanie użytkownikami"
        description="Przeglądaj, twórz i edytuj konta użytkowników systemu"
        actions={<CreateUserDialog />}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Wszyscy użytkownicy" value={allUsers.total} icon={Users} />
        <StatCard
          label="Aktywni użytkownicy"
          value={activeCount}
          icon={UserCheck}
        />
        <StatCard
          label="Administratorzy"
          value={adminCount}
          icon={ShieldCheck}
        />
      </div>

      {/* Table */}
      <UsersTable
        users={users}
        total={total}
        page={page}
        perPage={perPage}
        search={search}
      />
    </div>
  );
}
