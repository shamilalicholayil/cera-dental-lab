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
  reject,
  removeAttachment,
  requestClarification,
  resolve,
  respondClarification,
  startReview,
  uploadAttachment,
  getActiveForLabSlip,
  preflightAttachmentUpload,
} from "./correction.controller.js";

import { parseCorrectionAttachmentUpload } from "./correctionAttachment.upload.js";

import {
  correctionActionSchema,
  correctionClarificationSchema,
  createCorrectionSchema,
  listCorrectionsQuerySchema,
  rejectCorrectionSchema,
  resolveCorrectionSchema,
} from "./correction.schemas.js";

const CORRECTION_ROLES = [
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.CERA_ADMIN,
];

const router = Router();

router.use(authenticate);

router.post(
  "/:correctionId/attachments",
  authorizeRoles(...CORRECTION_ROLES),

  /*
   * Reject inaccessible, terminal, or already-full
   * corrections before buffering up to 10 MB in memory.
   */
  preflightAttachmentUpload,

  parseCorrectionAttachmentUpload,
  uploadAttachment,
);

router.get(
  "/:correctionId/attachments",
  authorizeRoles(...CORRECTION_ROLES),
  listAttachments,
);

router.get(
  "/:correctionId/attachments/:attachmentId/access",
  authorizeRoles(...CORRECTION_ROLES),
  accessAttachment,
);

router.delete(
  "/:correctionId/attachments/:attachmentId",
  authorizeRoles(...CORRECTION_ROLES),
  removeAttachment,
);

router.get(
  "/",
  authorizeRoles(
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CERA_ADMIN,
  ),
  validateQuery(listCorrectionsQuerySchema),
  list,
);

router.get(
  "/lab-slip/:labSlipId/active",
  authorizeRoles(
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CERA_ADMIN,
  ),
  getActiveForLabSlip,
);

router.get(
  "/:correctionId",
  authorizeRoles(
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CERA_ADMIN,
  ),
  getOne,
);

router.post(
  "/",
  authorizeRoles(
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CERA_ADMIN,
  ),
  validateBody(createCorrectionSchema),
  create,
);

router.post(
  "/:correctionId/start-review",
  authorizeRoles(USER_ROLES.CERA_STAFF, USER_ROLES.CERA_ADMIN),
  validateBody(correctionActionSchema),
  startReview,
);

router.post(
  "/:correctionId/request-clarification",
  authorizeRoles(USER_ROLES.CERA_STAFF, USER_ROLES.CERA_ADMIN),
  validateBody(correctionClarificationSchema),
  requestClarification,
);

router.post(
  "/:correctionId/respond-clarification",
  authorizeRoles(USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF),
  validateBody(correctionClarificationSchema),
  respondClarification,
);

router.post(
  "/:correctionId/resolve",
  authorizeRoles(USER_ROLES.CERA_STAFF, USER_ROLES.CERA_ADMIN),
  validateBody(resolveCorrectionSchema),
  resolve,
);

router.post(
  "/:correctionId/reject",
  authorizeRoles(USER_ROLES.CERA_STAFF, USER_ROLES.CERA_ADMIN),
  validateBody(rejectCorrectionSchema),
  reject,
);

export default router;
