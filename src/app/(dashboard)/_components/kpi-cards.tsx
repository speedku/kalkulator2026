import { StatCard } from "@/components/aether/stat-card";
import { FileText, DollarSign, Ship, Truck, Users } from "lucide-react";
import type { DashboardKpis } from "@/types/dashboard";

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Wyceny (miesiąc)"
        value={kpis.totalQuotationsMonth}
        icon={FileText}
      />
      <StatCard
        label="Przychód (przyjęte)"
        value={`${kpis.revenueMonth.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`}
        icon={DollarSign}
      />
      <StatCard
        label="Kontenery w drodze"
        value={kpis.containersInTransit}
        icon={Ship}
      />
      <StatCard
        label="Dostawy (7 dni)"
        value={kpis.upcomingDeliveriesWeek}
        icon={Truck}
      />
      <StatCard
        label="Aktywni użytkownicy"
        value={kpis.activeUsers}
        icon={Users}
      />
    </div>
  );
}
