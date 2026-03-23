export interface SalesAnalyticsRow {
  period: string;
  revenue: number;
  count: number;
}

export interface YoYRow {
  year: number;
  month: number;
  revenue: number;
  count: number;
}

export interface TopProductRow {
  sku: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface PackerStatRow {
  day: string;
  packages: number;
  packers: number;
}

export interface DeadStockRow {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  arrivedAt: Date | null;
}

export interface WarehouseKpis {
  containersCompleted: number;
  containersInTransit: number;
  totalContainerValueUsd: number;
}
