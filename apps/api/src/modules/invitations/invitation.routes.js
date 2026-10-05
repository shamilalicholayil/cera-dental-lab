import { Router } from "express";

import { validateBody } from "../../middleware/validateBody.js";

import { accept, preview } from "./invitation.controller.js";

import {
  acceptInvitationSchema,
  invitationTokenSchema,
} from "./invitation.schemas.js";

const router = Router();

router.post("/preview", validateBody(invitationTokenSchema), preview);

router.post("/accept", validateBody(acceptInvitationSchema), accept);

export default router;
