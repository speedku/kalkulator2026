import { getDashboardKpis, getWeeklyTrend, getActivityFeed, getUpcomingDeliveries } from "@/lib/dal/dashboard";
import { KpiCards } from "./_components/kpi-cards";
import { TrendChart } from "./_components/trend-chart";
import { ActivityFeed } from "./_components/activity-feed";
import { UpcomingWidget } from "./_components/upcoming-widget";
import { PageHeader } from "@/components/aether/page-header";

export default async function DashboardPage() {
  const [kpis, trendData, activityFeed, upcoming] = await Promise.all([
    getDashboardKpis(),
    getWeeklyTrend(),
    getActivityFeed(10),
    getUpcomingDeliveries(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Dashboard" description="Przegląd kluczowych wskaźników ALLBAG" />
      <KpiCards kpis={kpis} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={trendData} />
        </div>
        <div>
          <UpcomingWidget items={upcoming} />
        </div>
      </div>
      <ActivityFeed entries={activityFeed} />
    </div>
  );
}
