import { type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/dal/auth";
import { prisma } from "@/lib/db";

interface ExcelProductRow {
  name?: string;
  nazwa?: string;
  sku?: string;
  description?: string;
  opis?: string;
  image_url?: string;
  category_name?: string;
  kategoria?: string;
  paper_type?: string;
  rodzaj_papieru?: string;
  grammage?: number;
  gramatura?: number;
  box_quantity?: number;
  ilosc_w_kartonie?: number;
  pallet_quantity?: number;
  ilosc_na_palecie?: number;
  price?: number;
  cena?: number;
  is_active?: string | number;
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "Nie przesłano pliku" }, { status: 400 });

  // Validate file type
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return Response.json({ error: "Dozwolone są tylko pliki .xlsx i .xls" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelProductRow>(sheet, { defval: undefined });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    // Support both Polish and English column headers
    const name = String(row.name ?? row.nazwa ?? "").trim();
    const sku = String(row.sku ?? "").trim() || undefined;
    const description = String(row.description ?? row.opis ?? "").trim() || undefined;
    const imageUrl = String(row.image_url ?? "").trim() || undefined;
    const price = Number(row.price ?? row.cena ?? 0) || undefined;
    const paperType = String(row.paper_type ?? row.rodzaj_papieru ?? "").trim() || undefined;
    const grammage = Number(row.grammage ?? row.gramatura ?? 0) || undefined;
    const boxQuantity = Number(row.box_quantity ?? row.ilosc_w_kartonie ?? 0) || undefined;
    const palletQuantity = Number(row.pallet_quantity ?? row.ilosc_na_palecie ?? 0) || undefined;
    const isActive = !(String(row.is_active ?? "1").toLowerCase() === "0" || String(row.is_active ?? "").toLowerCase() === "nie" || String(row.is_active ?? "").toLowerCase() === "false");

    if (!name) { skipped++; continue; }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    try {
      if (sku) {
        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          await prisma.product.update({
            where: { sku },
            data: { name, description, imageUrl, price, paperType, grammage, boxQuantity, palletQuantity, isActive },
          });
          updated++;
        } else {
          await prisma.product.create({
            data: { name, slug: `${slug}-${Date.now()}`, sku, description, imageUrl, price, paperType, grammage, boxQuantity, palletQuantity, isActive },
          });
          imported++;
        }
      } else {
        // No SKU: upsert by exact name match
        const existing = await prisma.product.findFirst({ where: { name } });
        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data: { description, imageUrl, price, paperType, grammage, isActive } });
          updated++;
        } else {
          await prisma.product.create({
            data: { name, slug: `${slug}-${Date.now()}`, description, imageUrl, price, paperType, grammage, boxQuantity, palletQuantity, isActive },
          });
          imported++;
        }
      }
    } catch (e) {
      errors.push(`Wiersz "${name}": ${e instanceof Error ? e.message : "nieznany błąd"}`);
    }
  }

  return Response.json({ imported, updated, skipped, errors, total: rows.length });
}
