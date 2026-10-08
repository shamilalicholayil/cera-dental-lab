import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  accessAttachment,
  create,
  getOne,
  list,
  listAttachments,
  preflightAttachmentUpload,
  removeAttachment,
  update,
  uploadAttachment,
} from "./labSlip.controller.js";

import { parseLabSlipAttachmentUpload } from "./labSlipAttachment.upload.js";

import {
  createLabSlipSchema,
  listLabSlipsQuerySchema,
  updateLabSlipSchema,
} from "./labSlip.schemas.js";

const LAB_SLIP_WRITE_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
];

const LAB_SLIP_READ_ROLES = [
  ...LAB_SLIP_WRITE_ROLES,
  USER_ROLES.SCANNING_STAFF,
];

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles(...LAB_SLIP_WRITE_ROLES),
  validateQuery(listLabSlipsQuerySchema),
  list,
);

router.post(
  "/",
  authorizeRoles(...LAB_SLIP_WRITE_ROLES),
  validateBody(createLabSlipSchema),
  create,
);

router.post(
  "/:labSlipId/attachments",
  authorizeRoles(...LAB_SLIP_WRITE_ROLES),

  /*
   * Reject unauthorized/locked/full targets before Multer
   * buffers as much as 10 MB into application memory.
   */
  preflightAttachmentUpload,

  parseLabSlipAttachmentUpload,
  uploadAttachment,
);

router.get(
  "/:labSlipId/attachments",
  authorizeRoles(...LAB_SLIP_READ_ROLES),
  listAttachments,
);

router.get(
  "/:labSlipId/attachments/:attachmentId/access",
  authorizeRoles(...LAB_SLIP_READ_ROLES),
  accessAttachment,
);

router.delete(
  "/:labSlipId/attachments/:attachmentId",
  authorizeRoles(...LAB_SLIP_WRITE_ROLES),
  removeAttachment,
);

router.get("/:labSlipId", authorizeRoles(...LAB_SLIP_WRITE_ROLES), getOne);

router.patch(
  "/:labSlipId",
  authorizeRoles(...LAB_SLIP_WRITE_ROLES),
  validateBody(updateLabSlipSchema),
  update,
);

export default router;
