import type {
  Product,
  ProductCategory,
  ProductGroup,
  ProductVariant,
  ProductPrice,
} from "@prisma/client";

export type { Product, ProductCategory, ProductGroup, ProductVariant, ProductPrice };

export type ProductWithRelations = Product & {
  category: ProductCategory | null;
  group: ProductGroup | null;
  variants: (ProductVariant & { prices: ProductPrice[] })[];
};

export type ProductListItem = Pick<
  Product,
  "id" | "name" | "slug" | "sku" | "imageUrl" | "price" | "isActive" | "displayOrder"
> & {
  category: Pick<ProductCategory, "id" | "name"> | null;
  group: Pick<ProductGroup, "id" | "name" | "backgroundColor"> | null;
};
