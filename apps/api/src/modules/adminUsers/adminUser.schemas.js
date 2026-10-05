import { z } from "zod";

import { USER_ROLE_VALUES, USER_STATUS_VALUES } from "@cera/shared";

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),

  role: z.enum(USER_ROLE_VALUES).optional(),

  status: z.enum(USER_STATUS_VALUES).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});
