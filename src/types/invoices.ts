export interface InvoiceRow {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string | null;
  customerNip: string | null;
  status: string;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  vatRate: number;
  issuedAt: Date | null;
  dueAt: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string | null;
}

export interface InvoiceWithItems extends InvoiceRow {
  items: InvoiceItemRow[];
}

export interface InvoiceItemRow {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
  unitNet: number;
  totalNet: number;
}
