import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal/auth";
import { getUserById } from "@/lib/dal/users";
import { getUserPermissions, getAvailablePages } from "@/lib/dal/permissions";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { UserDetailTabs } from "./_components/user-detail-tabs";

export const dynamic = "force-dynamic";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) notFound();

  const [user, permissions, availablePages] = await Promise.all([
    getUserById(userId),
    getUserPermissions(userId),
    getAvailablePages(),
  ]);

  if (!user) notFound();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={user.name ?? user.email}
        description={user.email}
      />
      <GlassCard>
        <div className="p-6">
          <UserDetailTabs
            user={user}
            permissions={permissions}
            availablePages={availablePages}
          />
        </div>
      </GlassCard>
    </div>
  );
}
