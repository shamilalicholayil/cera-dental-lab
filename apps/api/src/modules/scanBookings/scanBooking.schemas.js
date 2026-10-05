import { z } from "zod";

import { SCAN_BOOKING_STATUS_VALUES } from "@cera/shared";

const objectIdString = z.string().trim().min(1);

const dateTimeString = z.string().datetime({
  offset: true,
});

export const createScanBookingSchema = z.object({
  labSlipId: objectIdString,

  requestedStartAt: dateTimeString,
});

export const listScanBookingsQuerySchema = z.object({
  status: z.enum(SCAN_BOOKING_STATUS_VALUES).optional(),

  clinicId: objectIdString.optional(),

  labSlipId: objectIdString.optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const proposeAlternateSchema = z.object({
  proposedStartAt: dateTimeString,
});

export const rejectScanBookingSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const cancelScanBookingSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const assignScanBookingSchema = z.object({
  scanningStaffId: objectIdString,
});
