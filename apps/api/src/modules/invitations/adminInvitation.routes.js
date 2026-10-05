import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import {
  create,
  list,
  regenerate,
  revoke,
} from "./adminInvitation.controller.js";

import { createInvitationSchema } from "./invitation.schemas.js";

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.CERA_ADMIN));

router.get("/", list);

router.post("/", validateBody(createInvitationSchema), create);

router.post("/:invitationId/revoke", revoke);

router.post("/:invitationId/regenerate", regenerate);

export default router;
