import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Phone number or email is required")
    .max(254),

  password: z.string().min(1, "Password is required").max(256),
});
