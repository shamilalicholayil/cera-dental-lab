import { Router } from "express";

import { validateBody } from "../../middleware/validateBody.js";

import { accept, preview } from "./invitation.controller.js";

import {
  acceptInvitationSchema,
  invitationTokenSchema,
} from "./invitation.schemas.js";

import {
  invitationAcceptRateLimiter,
  invitationPreviewRateLimiter,
} from "./invitation.rateLimit.js";

const router = Router();

router.post(
  "/preview",
  invitationPreviewRateLimiter,
  validateBody(invitationTokenSchema),
  preview,
);

router.post(
  "/accept",
  invitationAcceptRateLimiter,
  validateBody(acceptInvitationSchema),
  accept,
);

export default router;
