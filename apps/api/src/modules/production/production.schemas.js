import { z } from "zod";

import {
  LAB_SLIP_URGENCY_VALUES,
  PRODUCTION_STATUS,
  PRODUCTION_STATUS_VALUES,
} from "@cera/shared";

const optionalNote = z.string().trim().max(500).optional().or(z.literal(""));

export const listProductionsQuerySchema = z.object({
  status: z.enum([...PRODUCTION_STATUS_VALUES, "ALL"]).optional(),

  urgency: z.enum(LAB_SLIP_URGENCY_VALUES).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productionActionSchema = z.object({
  note: optionalNote,
});

export const moveProductionBackSchema = z.object({
  targetStatus: z.enum([
    PRODUCTION_STATUS.SUBMITTED,
    PRODUCTION_STATUS.IN_PRODUCTION,
  ]),

  reason: z.string().trim().min(1).max(500),
});
