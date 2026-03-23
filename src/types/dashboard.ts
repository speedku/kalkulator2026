export interface DashboardKpis {
  totalQuotationsMonth: number;
  revenueMonth: number; // sum of totalAmount for accepted quotations this month
  containersInTransit: number;
  upcomingDeliveriesWeek: number;
  activeUsers: number;
}

export interface TrendDataPoint {
  period: string; // e.g. "2026-12" (YYYY-WW) or "2026-03" (YYYY-MM)
  revenue: number;
  count: number;
}

export interface ActivityEntry {
  id: number;
  userId: number | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
}

export interface UpcomingItem {
  id: number;
  type: "container" | "delivery";
  label: string; // container number or delivery name
  etaDate: Date;
  status: string;
}
