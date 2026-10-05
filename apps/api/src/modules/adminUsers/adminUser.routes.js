import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import { activate, disable, list } from "./adminUser.controller.js";

import { listUsersQuerySchema } from "./adminUser.schemas.js";

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.CERA_ADMIN));

router.get("/", validateQuery(listUsersQuerySchema), list);

router.post("/:userId/disable", disable);

router.post("/:userId/activate", activate);

export default router;
