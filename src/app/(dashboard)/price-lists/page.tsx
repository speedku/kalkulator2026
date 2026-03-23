import { requireAdmin } from "@/lib/dal/auth";
import { getPriceLists } from "@/lib/dal/price-lists";
import { PageHeader } from "@/components/aether/page-header";
import { PriceListsTable } from "./_components/price-lists-table";
import Link from "next/link";

export default async function PriceListsPage() {
  await requireAdmin();
  const priceLists = await getPriceLists();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cenniki"
        description={`${priceLists.length} cenników w systemie`}
        actions={
          <Link
            href="/price-lists/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue"
          >
            + Nowy cennik
          </Link>
        }
      />
      <PriceListsTable data={priceLists} />
    </div>
  );
}
