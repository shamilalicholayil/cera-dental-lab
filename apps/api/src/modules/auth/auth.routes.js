import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";

import { validateBody } from "../../middleware/validateBody.js";

import { login } from "./auth.controller.js";

import { getCurrentUser } from "./auth.me.controller.js";

import { refreshSession } from "./auth.refresh.controller.js";

import { logoutCurrentSession } from "./auth.logout.controller.js";

import { loginRateLimiter } from "./auth.rateLimit.js";

import { loginSchema } from "./auth.schemas.js";

const router = Router();

router.post("/login", loginRateLimiter, validateBody(loginSchema), login);

router.post("/refresh", refreshSession);

router.post("/logout", logoutCurrentSession);

router.get("/me", authenticate, getCurrentUser);

export default router;
