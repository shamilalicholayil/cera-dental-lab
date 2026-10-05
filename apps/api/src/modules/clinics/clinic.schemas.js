import { z } from "zod";

import { CLINIC_STATUS_VALUES, CLINIC_TYPE_VALUES } from "@cera/shared";

const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const addressSchema = z.object({
  line1: z.string().trim().min(2).max(200),

  line2: optionalText(200),

  locality: optionalText(120),

  city: z.string().trim().min(2).max(120),

  district: optionalText(120),

  state: z.string().trim().min(2).max(120),

  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export const createClinicSchema = z.object({
  name: z.string().trim().min(2).max(160),

  type: z.enum(CLINIC_TYPE_VALUES),

  contactPhone: optionalText(30),

  email: z.string().trim().email().optional().or(z.literal("")),

  address: addressSchema,
});

export const updateClinicSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),

    type: z.enum(CLINIC_TYPE_VALUES).optional(),

    contactPhone: optionalText(30),

    email: z.string().trim().email().optional().or(z.literal("")),

    address: addressSchema.partial().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listAdminClinicsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),

  type: z.enum(CLINIC_TYPE_VALUES).optional(),

  status: z.enum(CLINIC_STATUS_VALUES).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listAccessibleClinicsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
});

export const addClinicMemberSchema = z.object({
  userId: z.string().trim().min(1),
});
