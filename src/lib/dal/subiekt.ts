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

// Discovery-first sync for domestic deliveries from Subiekt GT
// Queries information_schema for dok% tables, then attempts sync if dok__Dokument exists
export async function syncDeliveriesFromSubiekt(): Promise<{
  synced: number;
  errors: string[];
  discovered: boolean;
}> {
  await requireAdmin();

  // Step 1: Connect
  let pool: sql.ConnectionPool;
  try {
    pool = await getSubiektConnection();
  } catch (e) {
    return {
      synced: 0,
      errors: ["Nie można połączyć się z Subiekt GT: " + String(e)],
      discovered: false,
    };
  }

  // Step 2: Schema discovery — find delivery-related tables
  const discovery = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DB_NAME()
      AND TABLE_NAME LIKE 'dok%'
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  const tableNames: string[] = [
    ...new Set(
      (discovery.recordset as Array<{ TABLE_NAME: string }>).map(
        (r) => r.TABLE_NAME
      )
    ),
  ];

  if (tableNames.length === 0) {
    return {
      synced: 0,
      errors: [
        "Brak tabel dok% w bazie Subiekt GT — synchronizacja dostaw niedostępna",
      ],
      discovered: false,
    };
  }

  // Log discovered tables for debugging
  console.log("[subiekt] Discovered delivery tables:", tableNames.join(", "));

  // Step 3: Check if primary delivery table exists
  if (!tableNames.includes("dok__Dokument")) {
    return {
      synced: 0,
      errors: [
        `Znalezione tabele dok%: ${tableNames.join(", ")}. ` +
          "Tabela dok__Dokument nie istnieje — nie można zsynchronizować dostaw. " +
          "Skontaktuj się z administratorem w celu skonfigurowania synchronizacji.",
      ],
      discovered: true,
    };
  }

  // Step 4: Check available columns in dok__Dokument
  const columns = (
    discovery.recordset as Array<{ TABLE_NAME: string; COLUMN_NAME: string }>
  )
    .filter((r) => r.TABLE_NAME === "dok__Dokument")
    .map((r) => r.COLUMN_NAME);

  console.log("[subiekt] dok__Dokument columns:", columns.join(", "));

  // Without confirmed column mappings, return discovery result for manual review
  // DELV-04 is LOW confidence — stub with discovery info until column mapping is confirmed
  return {
    synced: 0,
    errors: [
      `Tabela dok__Dokument znaleziona (${columns.length} kolumn). ` +
        "Automatyczna synchronizacja dostaw wymaga ręcznej konfiguracji mapowania kolumn. " +
        `Dostępne kolumny: ${columns.slice(0, 10).join(", ")}${
          columns.length > 10 ? "..." : ""
        }`,
    ],
    discovered: true,
  };
}
