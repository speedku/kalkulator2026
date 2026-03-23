import type { PriceList } from "@prisma/client";

export type PriceListRow = Pick<
  PriceList,
  "id" | "code" | "name" | "description" | "isActive" | "displayOrder" | "createdAt"
>;

export type MarginMatrixEntry = {
  id: number;
  priceListId: number;
  productGroupId: number;
  productGroupName: string;
  marginPercent: number; // already coerced from Prisma Decimal
};

export type PriceListWithMargins = PriceListRow & {
  margins: MarginMatrixEntry[];
};
