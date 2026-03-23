export interface QuotationRow {
  id: number;
  quotationNumber: string;
  customerName: string;
  customerEmail: string | null;
  priceListId: number | null;
  status: string;
  totalAmount: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string | null;
}

export interface QuotationWithItems extends QuotationRow {
  items: QuotationItemRow[];
  priceListName: string | null;
  notes: string | null;
}

export interface QuotationItemRow {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartItem {
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
