import { z } from "zod";

import { USER_ROLE_VALUES } from "@cera/shared";

export const createInvitationSchema = z.object({
  name: z.string().trim().min(2).max(120),

  phone: z.string().trim().min(1),

  email: z.string().trim().email().optional().or(z.literal("")),

  role: z.enum(USER_ROLE_VALUES),
});

export const invitationTokenSchema = z.object({
  token: z.string().min(20).max(512),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(20).max(512),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(256),
});
