import { z } from "zod";

import { CATALOG_STATUS_VALUES } from "@cera/shared";

const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),

  description: optionalText(1000),

  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),

    description: optionalText(1000),

    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listAdminCategoriesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),

  status: z.enum(CATALOG_STATUS_VALUES).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createProductSchema = z.object({
  categoryId: z.string().trim().min(1),

  name: z.string().trim().min(2).max(160),

  shortDescription: optionalText(1500),

  publicVisible: z.boolean().default(false),

  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateProductSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),

    name: z.string().trim().min(2).max(160).optional(),

    shortDescription: optionalText(1500),

    publicVisible: z.boolean().optional(),

    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listAdminProductsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),

  categoryId: z.string().trim().optional(),

  status: z.enum(CATALOG_STATUS_VALUES).optional(),

  publicVisible: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listAccessibleProductsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),

  categoryId: z.string().trim().optional(),
});
