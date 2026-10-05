import { clearAuthCookies } from "./auth.cookies.js";

import { REFRESH_TOKEN_COOKIE } from "./auth.constants.js";

import { revokeRefreshToken } from "./logout.service.js";

export async function logoutCurrentSession(req, res, next) {
  try {
    const rawToken = req.cookies[REFRESH_TOKEN_COOKIE];

    await revokeRefreshToken(rawToken);

    clearAuthCookies(res);

    res.status(200).json({
      success: true,

      data: {
        message: "Signed out successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}
