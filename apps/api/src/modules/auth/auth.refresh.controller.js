import { serializeUser } from "../users/user.serializer.js";

import { clearAuthCookies, setAuthCookies } from "./auth.cookies.js";

import { REFRESH_TOKEN_COOKIE } from "./auth.constants.js";

import { rotateRefreshToken } from "./refresh.service.js";

export async function refreshSession(req, res, next) {
  try {
    const rawToken = req.cookies[REFRESH_TOKEN_COOKIE];

    const result = await rotateRefreshToken(rawToken);

    setAuthCookies(res, {
      accessToken: result.accessToken,

      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      success: true,

      data: {
        user: serializeUser(result.user),
      },
    });
  } catch (error) {
    clearAuthCookies(res);

    next(error);
  }
}
