import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import { create, getOne, list, update } from "./labSlip.controller.js";

import {
  createLabSlipSchema,
  listLabSlipsQuerySchema,
  updateLabSlipSchema,
} from "./labSlip.schemas.js";

const router = Router();

router.use(
  authenticate,
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
  ),
);

router.get("/", validateQuery(listLabSlipsQuerySchema), list);

router.post("/", validateBody(createLabSlipSchema), create);

router.get("/:labSlipId", getOne);

router.patch("/:labSlipId", validateBody(updateLabSlipSchema), update);

export default router;
