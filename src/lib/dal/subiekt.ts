import "server-only";
import * as sql from "mssql";
import { requireAdmin } from "@/lib/dal/auth";
import { prisma } from "@/lib/db";

const globalForSubiekt = globalThis as unknown as { subiektPool?: sql.ConnectionPool };

const subiektConfig: sql.config = {
  server: process.env.SUBIEKT_SERVER!, // "10.0.0.115\\INSERTGT"
  database: process.env.SUBIEKT_DATABASE!,
  user: process.env.SUBIEKT_USER!,
  password: process.env.SUBIEKT_PASSWORD!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

export async function getSubiektConnection(): Promise<sql.ConnectionPool> {
  if (!globalForSubiekt.subiektPool) {
    globalForSubiekt.subiektPool = await new sql.ConnectionPool(subiektConfig).connect();
  }
  return globalForSubiekt.subiektPool;
}

// Sync products from Subiekt GT tw__Towar table into local MySQL products table
// Only inserts/updates — never deletes local products
export async function syncProductsFromSubiekt(): Promise<{
  synced: number;
  updated: number;
  errors: string[];
}> {
  await requireAdmin();
  const pool = await getSubiektConnection();
  const result = await pool
    .request()
    .query(
      "SELECT tw_Id, tw_Symbol, tw_Nazwa, tw_Cena FROM tw__Towar WHERE tw_Zablokowany = 0"
    );
  const rows = result.recordset as Array<{
    tw_Id: number;
    tw_Symbol: string;
    tw_Nazwa: string;
    tw_Cena: number;
  }>;

  let synced = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const slug = row.tw_Symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existing = await prisma.product.findUnique({ where: { sku: row.tw_Symbol } });
      if (existing) {
        await prisma.product.update({
          where: { sku: row.tw_Symbol },
          data: { name: row.tw_Nazwa, price: row.tw_Cena },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name: row.tw_Nazwa,
            slug: `${slug}-${row.tw_Id}`,
            sku: row.tw_Symbol,
            price: row.tw_Cena,
          },
        });
        synced++;
      }
    } catch (e) {
      errors.push(`${row.tw_Symbol}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }
  return { synced, updated, errors };
}
