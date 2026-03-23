import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/dal/auth";
import type {
  DashboardKpis,
  TrendDataPoint,
  ActivityEntry,
  UpcomingItem,
} from "@/types/dashboard";

export async function getDashboardKpis(): Promise<DashboardKpis> {
  await requireAuth();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalQuotationsMonth,
    revenueResult,
    containersInTransit,
    upcomingDeliveriesWeek,
    activeUsers,
  ] = await Promise.all([
    prisma.quotation.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.quotation.aggregate({
      _sum: { totalAmount: true },
      where: { status: "accepted", createdAt: { gte: monthStart } },
    }),
    prisma.container.count({
      where: { status: { in: ["in_transit", "at_port"] } },
    }),
    prisma.domesticDelivery.count({
      where: {
        etaDate: { gte: now, lte: weekEnd },
        status: { not: "cancelled" },
      },
    }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  return {
    totalQuotationsMonth,
    revenueMonth: Number(revenueResult._sum.totalAmount ?? 0),
    containersInTransit,
    upcomingDeliveriesWeek,
    activeUsers,
  };
}

export async function getWeeklyTrend(): Promise<TrendDataPoint[]> {
  await requireAuth();
  const rows = await prisma.$queryRaw<
    Array<{ period: string; revenue: unknown; count: bigint }>
  >`
    SELECT
      DATE_FORMAT(created_at, '%Y-%u') AS period,
      SUM(total_amount) AS revenue,
      COUNT(*) AS count
    FROM quotations
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
    GROUP BY DATE_FORMAT(created_at, '%Y-%u')
    ORDER BY period ASC
  `;
  return rows.map((r) => ({
    period: r.period,
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

export async function getActivityFeed(take = 10): Promise<ActivityEntry[]> {
  await requireAuth();
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true, email: true } } },
  });
  return logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    metadata: l.metadata ? (JSON.parse(l.metadata) as Record<string, unknown>) : null,
    createdAt: l.createdAt,
    user: l.user ? { name: l.user.name, email: l.user.email } : null,
  }));
}

export async function getUpcomingDeliveries(): Promise<UpcomingItem[]> {
  await requireAuth();
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [containers, deliveries] = await Promise.all([
    prisma.container.findMany({
      where: {
        etaDate: { gte: now, lte: twoWeeks },
        status: { not: "completed" },
      },
      select: {
        id: true,
        containerNumber: true,
        etaDate: true,
        status: true,
      },
      orderBy: { etaDate: "asc" },
      take: 5,
    }),
    prisma.domesticDelivery.findMany({
      where: {
        etaDate: { gte: now, lte: twoWeeks },
        status: { not: "cancelled" },
      },
      select: { id: true, name: true, etaDate: true, status: true },
      orderBy: { etaDate: "asc" },
      take: 5,
    }),
  ]);

  const items: UpcomingItem[] = [
    ...containers.map((c) => ({
      id: c.id,
      type: "container" as const,
      label: c.containerNumber,
      etaDate: c.etaDate,
      status: c.status,
    })),
    ...deliveries.map((d) => ({
      id: d.id,
      type: "delivery" as const,
      label: d.name,
      etaDate: d.etaDate,
      status: d.status,
    })),
  ];

  return items
    .sort((a, b) => a.etaDate.getTime() - b.etaDate.getTime())
    .slice(0, 8);
}
