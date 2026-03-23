import { type NextRequest } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require("xlsx") as typeof import("xlsx");
import { requireAdmin } from "@/lib/dal/auth";
import { getSalesAnalytics, getWoWComparison, getPackerStats, getDeadStock } from "@/lib/dal/analytics";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const report = req.nextUrl.searchParams.get("report") ?? "sales";

  let data: Record<string, unknown>[] = [];
  let sheetName = "Raport";

  if (report === "sales") {
    data = (await getSalesAnalytics()).map((r) => ({
      Okres: r.period,
      "Przychód (zł)": r.revenue,
      "Liczba wycen": r.count,
    }));
    sheetName = "Sprzedaż";
  } else if (report === "wow") {
    data = (await getWoWComparison()).map((r) => ({
      Tydzień: r.period,
      "Przychód (zł)": r.revenue,
      "Liczba wycen": r.count,
    }));
    sheetName = "WoW";
  } else if (report === "paczkarnia") {
    data = (await getPackerStats()).map((r) => ({
      Dzień: r.day,
      Paczki: r.packages,
      Pakowaczy: r.packers,
    }));
    sheetName = "Paczkarnia";
  } else if (report === "dead-stock") {
    data = (await getDeadStock()).map((r) => ({
      SKU: r.sku,
      Nazwa: r.name,
      Ilość: r.quantity,
      "Data przyjazdu": r.arrivedAt ? r.arrivedAt.toISOString().slice(0, 10) : "",
    }));
    sheetName = "Martwe zapasy";
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buf = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer);

  return new Response(buf, {
    headers: {
      "Content-Disposition": `attachment; filename="raport-${report}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
