import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal/auth";
import type {
  SalesAnalyticsRow,
  YoYRow,
  TopProductRow,
  PackerStatRow,
  DeadStockRow,
  WarehouseKpis,
} from "@/types/analytics";

export async function getSalesAnalytics(): Promise<SalesAnalyticsRow[]> {
  await requireAdmin();
  const rows = await prisma.$queryRaw<
    Array<{ period: string; revenue: unknown; count: bigint }>
  >`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS period,
      SUM(total_amount) AS revenue,
      COUNT(*) AS count
    FROM quotations
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY period ASC
  `;
  return rows.map((r) => ({
    period: r.period,
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

export async function getYoYComparison(): Promise<YoYRow[]> {
  await requireAdmin();
  const rows = await prisma.$queryRaw<
    Array<{ month: unknown; year: unknown; revenue: unknown; count: bigint }>
  >`
    SELECT
      MONTH(created_at) AS month,
      YEAR(created_at) AS year,
      SUM(total_amount) AS revenue,
      COUNT(*) AS count
    FROM quotations
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY year ASC, month ASC
  `;
  return rows.map((r) => ({
    month: Number(r.month),
    year: Number(r.year),
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

export async function getWoWComparison(): Promise<SalesAnalyticsRow[]> {
  await requireAdmin();
  const rows = await prisma.$queryRaw<
    Array<{ period: string; revenue: unknown; count: bigint }>
  >`
    SELECT
      DATE_FORMAT(created_at, '%Y-%u') AS period,
      SUM(total_amount) AS revenue,
      COUNT(*) AS count
    FROM quotations
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
    GROUP BY DATE_FORMAT(created_at, '%Y-%u')
    ORDER BY period ASC
  `;
  return rows.map((r) => ({
    period: r.period,
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

export async function getTopProducts(limit = 10): Promise<TopProductRow[]> {
  await requireAdmin();
  const rows = await prisma.$queryRaw<
    Array<{ sku: string; name: string; revenue: unknown; quantity: unknown }>
  >`
    SELECT
      qi.sku,
      qi.product_name AS name,
      SUM(qi.total_price) AS revenue,
      SUM(qi.quantity) AS quantity
    FROM quotation_items qi
    JOIN quotations q ON qi.quotation_id = q.id
    WHERE q.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      AND q.status = 'accepted'
    GROUP BY qi.sku, qi.product_name
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    sku: r.sku ?? "",
    name: r.name,
    revenue: Number(r.revenue),
    quantity: Number(r.quantity),
  }));
}

export async function getPackerStats(): Promise<PackerStatRow[]> {
  await requireAdmin();
  try {
    const rows = await prisma.$queryRaw<
      Array<{ day: unknown; packages: unknown; packers: unknown }>
    >`
      SELECT
        DATE(recorded_at) AS day,
        MAX(total_packages) AS packages,
        MAX(packer_count) AS packers
      FROM packer_live_stats
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(recorded_at)
      ORDER BY day ASC
    `;
    return rows.map((r) => ({
      day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
      packages: Number(r.packages),
      packers: Number(r.packers),
    }));
  } catch {
    // packer_live_stats may not exist in local dev environment
    return [];
  }
}

export async function getDeadStock(): Promise<DeadStockRow[]> {
  await requireAdmin();
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      sku: string;
      quantity: unknown;
      arrivedAt: Date | null;
    }>
  >`
    SELECT p.id, p.name, p.sku, ci.quantity, c.actual_arrival_date AS arrivedAt
    FROM container_items ci
    JOIN containers c ON ci.container_id = c.id
    JOIN products p ON ci.product_id = p.id
    WHERE c.status = 'completed'
      AND c.actual_arrival_date < DATE_SUB(NOW(), INTERVAL 6 MONTH)
      AND NOT EXISTS (
        SELECT 1 FROM quotation_items qi
        WHERE qi.sku = p.sku
          AND qi.quotation_id IN (
            SELECT id FROM quotations WHERE created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
          )
      )
    ORDER BY c.actual_arrival_date ASC
    LIMIT 50
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku ?? "",
    quantity: Number(r.quantity),
    arrivedAt: r.arrivedAt,
  }));
}

export async function getWarehouseKpis(): Promise<WarehouseKpis> {
  await requireAdmin();
  const [completed, inTransit, valueResult] = await Promise.all([
    prisma.container.count({ where: { status: "completed" } }),
    prisma.container.count({
      where: { status: { in: ["in_transit", "at_port"] } },
    }),
    prisma.container.aggregate({ _sum: { totalValue: true } }),
  ]);
  return {
    containersCompleted: completed,
    containersInTransit: inTransit,
    totalContainerValueUsd: Number(valueResult._sum.totalValue ?? 0),
  };
}
