export type ContainerStatus = "in_transit" | "at_port" | "unloaded" | "completed";
export type ContainerDocumentType = "invoice" | "bol" | "certificate" | "photo" | "customs";
export type ContainerNotificationType = "eta_7days" | "eta_3days" | "eta_1day" | "arrived" | "delayed";

export interface ContainerRow {
  id: number;
  containerNumber: string;
  carrier: string;
  portOfOrigin: string;
  portOfDestination: string;
  shipmentDate: Date;
  etaDate: Date;
  actualArrivalDate: Date | null;
  status: ContainerStatus;
  totalValue: number | null;  // Number(Decimal) conversion applied in DAL
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContainerItem {
  id: number;
  containerId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;   // Number(Decimal) conversion applied in DAL
  totalPrice: number;  // computed: quantity * unitPrice (NOT a stored column — computed in DAL)
  notes: string | null;
  product: {
    id: number;
    name: string;
    sku: string | null;
    boxQuantity: number | null;
    boxWeight: number | null;
  };
}

export interface ContainerDocumentRow {
  id: number;
  containerId: number;
  documentType: ContainerDocumentType;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: Date;
}

export interface ContainerWithItems extends ContainerRow {
  items: ContainerItem[];
  documents: ContainerDocumentRow[];
}

export interface ContainerAnalytics {
  inTransitCount: number;
  etaThisWeekCount: number;
  totalValueUsd: number;
  onTimePct: number | null;
  avgDays: number;
  completedCount: number;
}
