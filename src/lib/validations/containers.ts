import { z } from "zod";

export const ContainerSchema = z.object({
  containerNumber: z.string().min(1).max(20),
  carrier: z.string().min(1).max(100),
  portOfOrigin: z.string().min(1).max(100),
  portOfDestination: z.string().min(1).max(100),
  shipmentDate: z.coerce.date(),
  etaDate: z.coerce.date(),
  actualArrivalDate: z.coerce.date().nullable().optional(),
  status: z.enum(["in_transit", "at_port", "unloaded", "completed"]).default("in_transit"),
  totalValue: z.coerce.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const ContainerStatusSchema = z.object({
  status: z.enum(["in_transit", "at_port", "unloaded", "completed"]),
  actualArrivalDate: z.coerce.date().nullable().optional(),
});

export const ContainerItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  variantId: z.coerce.number().int().positive().nullable().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  notes: z.string().nullable().optional(),
});

export const ContainerDocumentSchema = z.object({
  documentType: z.enum(["invoice", "bol", "certificate", "photo", "customs"]),
  originalFilename: z.string().min(1).max(255),
  storedFilename: z.string().min(1).max(255),
  filePath: z.string().max(500),
  fileSize: z.coerce.number().int().positive().nullable().optional(),
  mimeType: z.string().max(100).nullable().optional(),
});

export const NotifyContainerSchema = z.object({
  recipientEmail: z.string().email(),
  notificationType: z.enum(["eta_7days", "eta_3days", "eta_1day", "arrived", "delayed"]),
});

export type ContainerInput = z.infer<typeof ContainerSchema>;
export type ContainerItemInput = z.infer<typeof ContainerItemSchema>;
export type ContainerDocumentInput = z.infer<typeof ContainerDocumentSchema>;
