import { USER_STATUS } from "@cera/shared";

import { AppError } from "../utils/AppError.js";

import { ACCESS_TOKEN_COOKIE } from "../modules/auth/auth.constants.js";

import { verifyAccessToken } from "../modules/auth/token.js";

import { User } from "../modules/users/user.model.js";

function authenticationRequired() {
  return new AppError(
    "Authentication required",
    401,
    "AUTHENTICATION_REQUIRED",
  );
}

export async function authenticate(req, res, next) {
  const token = req.cookies[ACCESS_TOKEN_COOKIE];

  if (!token) {
    return next(authenticationRequired());
  }

  try {
    const payload = await verifyAccessToken(token);

    if (!payload.sub) {
      return next(authenticationRequired());
    }

    const user = await User.findById(payload.sub).select("+authVersion");

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      return next(authenticationRequired());
    }

    const tokenAuthVersion = Number.isInteger(payload.authVersion)
      ? payload.authVersion
      : 0;

    const userAuthVersion = user.authVersion ?? 0;

    if (tokenAuthVersion !== userAuthVersion) {
      return next(authenticationRequired());
    }

    req.user = user;

    next();
  } catch {
    next(authenticationRequired());
  }
}
