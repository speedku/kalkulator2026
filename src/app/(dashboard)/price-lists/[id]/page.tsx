import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal/auth";
import { getPriceListById } from "@/lib/dal/price-lists";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { PriceListForm } from "./_components/price-list-form";
import { MarginMatrixEditor } from "./_components/margin-matrix-editor";
import { CloneDialog } from "./_components/clone-dialog";
import Link from "next/link";

interface PriceListDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PriceListDetailPage({ params }: PriceListDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const priceListId = Number(id);
  if (isNaN(priceListId)) notFound();

  const [priceList, productGroups] = await Promise.all([
    getPriceListById(priceListId),
    prisma.productGroup.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  if (!priceList) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={priceList.name}
        description={`Kod: ${priceList.code}`}
        actions={
          <Link
            href="/price-lists"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-transparent text-aether-text border border-aether-border hover:border-aether-border-glow hover:shadow-glow-sm"
          >
            Powrót do listy
          </Link>
        }
      />

      {/* Edit form */}
      <PriceListForm mode="edit" priceList={priceList} />

      {/* Margin matrix editor */}
      <GlassCard title="Macierz marż" description="Ustaw marże dla każdej grupy produktowej">
        <MarginMatrixEditor
          priceListId={priceList.id}
          productGroups={productGroups}
          existingMargins={priceList.margins}
        />
      </GlassCard>

      {/* Clone dialog */}
      <GlassCard title="Klonowanie cennika" description="Utwórz kopię tego cennika z nowym kodem i nazwą">
        <div className="px-6 py-6">
          <CloneDialog sourceId={priceList.id} sourceName={priceList.name} />
        </div>
      </GlassCard>
    </div>
  );
}
