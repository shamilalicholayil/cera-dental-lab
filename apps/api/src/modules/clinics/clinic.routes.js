import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  getAccessible,
  listAccessible,
  listDoctors,
} from "./clinic.controller.js";

import { listAccessibleClinicsQuerySchema } from "./clinic.schemas.js";

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

router.get(
  "/",
  validateQuery(listAccessibleClinicsQuerySchema),
  listAccessible,
);

router.get(
  "/:clinicId/doctors",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CLINIC_STAFF,
  ),
  listDoctors,
);

router.get("/:clinicId", getAccessible);

export default router;
