import { logger } from "../../config/logger.js";

import { serializeUser } from "../users/user.serializer.js";

import { setAuthCookies } from "./auth.cookies.js";

import { authenticateUser } from "./auth.service.js";

export async function login(req, res) {
  const { identifier, password } = req.body;

  const result = await authenticateUser({
    identifier,
    password,
  });

  setAuthCookies(res, {
    accessToken: result.accessToken,

    refreshToken: result.refreshToken,
  });

  logger.info("User logged in", {
    requestId: req.id,

    userId: result.user.id,

    role: result.user.role,
  });

  res.status(200).json({
    success: true,

    data: {
      user: serializeUser(result.user),
    },
  });
}
