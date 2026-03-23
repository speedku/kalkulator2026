import { z } from "zod";

export const DomesticDeliverySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  supplier: z.string().min(1).max(255),
  etaDate: z.coerce.date(),
  actualArrivalDate: z.coerce.date().nullable().optional(),
  status: z.enum(["pending", "in_transit", "delivered", "cancelled"]).default("pending"),
  notes: z.string().nullable().optional(),
});

export const DomesticDeliveryStatusSchema = z.object({
  status: z.enum(["pending", "in_transit", "delivered", "cancelled"]),
  actualArrivalDate: z.coerce.date().nullable().optional(),
});

export type DomesticDeliveryInput = z.infer<typeof DomesticDeliverySchema>;
