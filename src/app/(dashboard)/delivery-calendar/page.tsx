import { requireAuth } from "@/lib/dal/auth";
import { getCalendarDeliveries } from "@/lib/dal/domestic-deliveries";
import { DeliveryCalendar } from "./_components/delivery-calendar";
import { PageHeader } from "@/components/aether/page-header";

interface SearchParams {
  year?: string;
  month?: string;
}

export default async function DeliveryCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const year = Number(sp.year) || new Date().getFullYear();
  const month = Number(sp.month) || new Date().getMonth() + 1;

  const { containers, domesticDeliveries } = await getCalendarDeliveries(
    year,
    month
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalendarz dostaw"
        description="Kontenery i dostawy krajowe w widoku miesięcznym"
      />
      <DeliveryCalendar
        year={year}
        month={month}
        containers={containers}
        domesticDeliveries={domesticDeliveries}
      />
    </div>
  );
}
