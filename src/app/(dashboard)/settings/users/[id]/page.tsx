import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal/auth";
import { getUserById } from "@/lib/dal/users";
import { getUserPermissions, getAvailablePages } from "@/lib/dal/permissions";
import { getPriceLists } from "@/lib/dal/price-lists";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { UserDetailTabs } from "./_components/user-detail-tabs";
import { PriceListAssignment } from "./_components/price-list-assignment";

export const dynamic = "force-dynamic";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) notFound();

  const [user, permissions, availablePages, priceLists] = await Promise.all([
    getUserById(userId),
    getUserPermissions(userId),
    getAvailablePages(),
    getPriceLists(),
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
      <GlassCard title="Cennik" description="Przypisz cennik do tego użytkownika">
        <div className="px-6 py-6">
          <PriceListAssignment
            userId={user.id}
            currentPriceListId={user.priceListId ?? null}
            priceLists={priceLists}
          />
        </div>
      </GlassCard>
    </div>
  );
}
