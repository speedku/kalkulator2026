export type DomesticDeliveryStatus = "pending" | "in_transit" | "delivered" | "cancelled";
export type DomesticDocumentType = "invoice" | "photo" | "spreadsheet" | "other";

export interface DomesticDeliveryRow {
  id: number;
  name: string;
  description: string | null;
  supplier: string;
  etaDate: Date;
  actualArrivalDate: Date | null;
  status: DomesticDeliveryStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomesticDeliveryDocument {
  id: number;
  deliveryId: number;
  documentType: DomesticDocumentType;
  originalFilename: string;
  filePath: string;
  fileSize: number | null;
  uploadedAt: Date;
}

export interface DomesticDeliveryWithDocuments extends DomesticDeliveryRow {
  documents: DomesticDeliveryDocument[];
}

export interface CalendarEvent {
  id: number;
  type: "container" | "domestic";
  label: string;         // containerNumber or delivery name
  etaDate: Date;
  status: string;
  detail: string;        // carrier or supplier
  href: string;          // /containers/[id] or /deliveries/[id]
}
