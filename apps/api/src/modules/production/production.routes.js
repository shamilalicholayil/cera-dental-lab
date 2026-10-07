import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  complete,
  getOne,
  list,
  moveBack,
  start,
} from "./production.controller.js";

import {
  listProductionsQuerySchema,
  moveProductionBackSchema,
  productionActionSchema,
} from "./production.schemas.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateQuery(listProductionsQuerySchema),
  list,
);

router.get(
  "/:productionId",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  getOne,
);

/*
 * Normal Cera production transitions.
 */

router.post(
  "/:productionId/start",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateBody(productionActionSchema),
  start,
);

router.post(
  "/:productionId/complete",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateBody(productionActionSchema),
  complete,
);

/*
 * Administrative backward transition.
 */

router.post(
  "/:productionId/move-back",
  authorizeRoles(USER_ROLES.CERA_ADMIN),
  validateBody(moveProductionBackSchema),
  moveBack,
);

export default router;
