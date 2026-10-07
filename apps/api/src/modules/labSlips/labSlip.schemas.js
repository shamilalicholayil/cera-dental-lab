import { z } from "zod";

import {
  LAB_SLIP_SOURCE_VALUES,
  LAB_SLIP_URGENCY,
  LAB_SLIP_URGENCY_VALUES,
  TOOTH_VALUES,
} from "@cera/shared";

const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const itemSchema = z.object({
  productId: z.string().trim().min(1),

  teeth: z
    .array(z.enum(TOOTH_VALUES))
    .max(32)
    .default([])
    .refine((teeth) => new Set(teeth).size === teeth.length, {
      message: "Duplicate teeth are not allowed",
    }),

  shade: optionalText(50),

  ponticDesign: optionalText(120),

  designNotes: optionalText(1000),
});

export const createLabSlipSchema = z.object({
  clinicId: z.string().trim().min(1),

  /*
   * Doctor login does not need to send doctorId.
   * The service derives it from the authenticated user.
   */
  doctorId: z.string().trim().optional(),

  source: z.enum(LAB_SLIP_SOURCE_VALUES).optional(),

  urgency: z.enum(LAB_SLIP_URGENCY_VALUES).default(LAB_SLIP_URGENCY.STANDARD),

  patient: z.object({
    name: z.string().trim().min(1).max(160),

    reference: optionalText(120),
  }),

  items: z.array(itemSchema).min(1, "At least one product is required").max(30),

  notes: optionalText(3000),

  scanRequired: z.boolean().default(false),
});

export const listLabSlipsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),

  clinicId: z.string().trim().optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateLabSlipSchema = z
  .object({
    urgency: z.enum(LAB_SLIP_URGENCY_VALUES).optional(),

    patient: z
      .object({
        name: z.string().trim().min(1).max(160),

        reference: optionalText(120),
      })
      .optional(),

    items: z
      .array(itemSchema)
      .min(1, "At least one product is required")
      .max(30)
      .optional(),

    notes: optionalText(3000),

    overrideReason: optionalText(500),
  })
  .strict()
  .refine(
    (data) =>
      ["urgency", "patient", "items", "notes"].some(
        (field) => data[field] !== undefined,
      ),
    {
      message: "At least one editable field must be provided",
    },
  );
