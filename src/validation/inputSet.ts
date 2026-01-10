import { z } from "zod";

export const inputSetCreateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  chargePoints: z.number().int().min(1).max(300),
  arrivalMultiplier: z.number().min(0.2).max(2.0).optional().default(1.0),
  consumptionKwhPer100km: z.number().min(1).max(100).optional().default(18),
  chargerPowerKw: z.number().min(0.1).max(1000).optional().default(11)
});

export const inputSetUpdateSchema = inputSetCreateSchema.partial();

