import { z } from "zod";

import {
  CORRECTION_OUTCOME_VALUES,
  CORRECTION_STATUS_VALUES,
} from "@cera/shared";

const optionalNote = z.string().trim().max(3000).optional().or(z.literal(""));

const requiredNote = z.string().trim().min(1).max(3000);

export const listCorrectionsQuerySchema = z.object({
  status: z.enum([...CORRECTION_STATUS_VALUES, "ALL", "ACTIVE"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createCorrectionSchema = z.object({
  labSlipId: z.string().trim().min(1),

  description: z.string().trim().min(1).max(3000),

  affectedLabSlipItemIds: z.array(z.string().trim().min(1)).optional(),
});

export const correctionActionSchema = z.object({
  note: optionalNote,
});

export const correctionClarificationSchema = z.object({
  note: requiredNote,
});

export const resolveCorrectionSchema = z.object({
  outcome: z.enum(CORRECTION_OUTCOME_VALUES),

  note: optionalNote,
});

export const rejectCorrectionSchema = z.object({
  note: optionalNote,
});
