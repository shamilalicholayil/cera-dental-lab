import { env } from "../../config/env.js";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_MS,
} from "./auth.constants.js";

function baseCookieOptions() {
  return {
    httpOnly: true,

    secure: env.NODE_ENV === "production",

    sameSite: "lax",
  };
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),

    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,

    path: "/api/v1",
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),

    maxAge: REFRESH_TOKEN_TTL_MS,

    path: "/api/v1/auth",
  });
}

export function clearAuthCookies(res) {
  const options = baseCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    ...options,
    path: "/api/v1",
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...options,
    path: "/api/v1/auth",
  });
}
