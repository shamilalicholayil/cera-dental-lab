import { USER_STATUS } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { User } from "../users/user.model.js";

import { normalizeEmail, normalizeIndianPhone } from "../users/user.utils.js";

import { verifyPassword } from "./password.js";

import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from "./token.js";

import { RefreshToken } from "./refreshToken.model.js";

import { REFRESH_TOKEN_TTL_MS } from "./auth.constants.js";

const AUTH_ERROR_MESSAGE = "Invalid phone/email or password";

function authenticationFailed() {
  return new AppError(AUTH_ERROR_MESSAGE, 401, "AUTHENTICATION_FAILED");
}

function buildIdentifierQuery(identifier) {
  const email = normalizeEmail(identifier);

  if (email && email.includes("@")) {
    return {
      email,
    };
  }

  const phone = normalizeIndianPhone(identifier);

  if (phone) {
    return {
      phone,
    };
  }

  return null;
}

export async function authenticateUser({ identifier, password }) {
  const query = buildIdentifierQuery(identifier);

  if (!query) {
    throw authenticationFailed();
  }

  const user = await User.findOne(query).select("+passwordHash +authVersion");

  if (!user) {
    throw authenticationFailed();
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw authenticationFailed();
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    throw authenticationFailed();
  }

  const accessToken = await createAccessToken(user);

  const refreshToken = createRefreshToken();

  const tokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await RefreshToken.create({
    userId: user._id,
    authVersion: user.authVersion ?? 0,
    tokenHash,
    expiresAt,
  });

  user.lastLoginAt = new Date();

  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
}
