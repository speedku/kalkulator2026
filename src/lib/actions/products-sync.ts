"use server";
import { syncProductsFromSubiekt } from "@/lib/dal/subiekt";

export async function syncProductsFromSubiektAction(): Promise<{
  synced: number;
  updated: number;
  errors: string[];
}> {
  return syncProductsFromSubiekt();
}
