import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  activate,
  addMember,
  create,
  disable,
  getOne,
  list,
  members,
  removeMember,
  update,
} from "./adminClinic.controller.js";

import {
  addClinicMemberSchema,
  createClinicSchema,
  listAdminClinicsQuerySchema,
  updateClinicSchema,
} from "./clinic.schemas.js";

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.CERA_ADMIN));

router.get("/", validateQuery(listAdminClinicsQuerySchema), list);

router.post("/", validateBody(createClinicSchema), create);

router.get("/:clinicId", getOne);

router.patch("/:clinicId", validateBody(updateClinicSchema), update);

router.post("/:clinicId/disable", disable);

router.post("/:clinicId/activate", activate);

router.get("/:clinicId/members", members);

router.post(
  "/:clinicId/members",
  validateBody(addClinicMemberSchema),
  addMember,
);

router.delete("/:clinicId/members/:userId", removeMember);

export default router;
