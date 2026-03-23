import { requireAuth } from "@/lib/dal/auth";
import { getUserPriceList } from "@/lib/dal/price-lists";
import { auth } from "@/auth";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";

export default async function MyPriceListPage() {
  const session = await auth();
  await requireAuth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) {
    return <div className="p-6 text-aether-text">Brak sesji</div>;
  }

  const priceList = await getUserPriceList(userId);

  if (!priceList) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mój cennik" />
        <GlassCard>
          <div className="px-6 py-6">
            <p className="text-aether-text-secondary text-sm">
              Nie masz przypisanego cennika. Skontaktuj się z administratorem.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Cennik: ${priceList.name}`}
        description={priceList.description ?? undefined}
      />
      <GlassCard>
        <div className="px-6 py-6">
          {priceList.margins.length === 0 ? (
            <p className="text-aether-text-secondary text-sm">
              Cennik nie ma jeszcze ustawionych marż.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aether-border">
                  <th className="text-left py-2 pb-3 text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Grupa produktowa
                  </th>
                  <th className="text-right py-2 pb-3 text-xs font-semibold uppercase tracking-wider text-aether-text-secondary">
                    Marża (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceList.margins.map((m) => (
                  <tr
                    key={m.productGroupId}
                    className="border-t border-white/10 hover:bg-aether-elevated/30 transition-colors"
                  >
                    <td className="py-2.5 text-aether-text">{m.productGroupName}</td>
                    <td className="py-2.5 text-right font-mono text-aether-text">
                      {m.marginPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
