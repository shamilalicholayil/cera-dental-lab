import { USER_STATUS } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { User } from "../users/user.model.js";

import { REFRESH_TOKEN_TTL_MS } from "./auth.constants.js";

import { RefreshToken } from "./refreshToken.model.js";

import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from "./token.js";

function invalidRefreshToken() {
  return new AppError(
    "Your session has expired. Please sign in again.",
    401,
    "REFRESH_TOKEN_INVALID",
  );
}

async function revokeUserSessions(userId) {
  await RefreshToken.updateMany(
    {
      userId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
}

export async function rotateRefreshToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    throw invalidRefreshToken();
  }

  const tokenHash = hashRefreshToken(rawToken);

  const now = new Date();

  /*
   * Atomically consume the token.
   *
   * Only one request can successfully move a token
   * from active → revoked.
   */
  const consumedToken = await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,

      expiresAt: {
        $gt: now,
      },
    },
    {
      $set: {
        revokedAt: now,
      },
    },
    {
      returnDocument: "before",
    },
  );

  if (!consumedToken) {
    /*
     * Determine whether this was a previously valid,
     * already-used token.
     */
    const previousToken = await RefreshToken.findOne({
      tokenHash,
    });

    if (previousToken?.revokedAt) {
      /*
       * A rotated token is being used again.
       *
       * This can indicate token theft/replay.
       * Revoke every active session belonging to
       * this user.
       */
      await revokeUserSessions(previousToken.userId);
    }

    throw invalidRefreshToken();
  }

  const user = await User.findById(consumedToken.userId);

  if (!user || user.status !== USER_STATUS.ACTIVE) {
    await revokeUserSessions(consumedToken.userId);

    throw invalidRefreshToken();
  }

  const newRawToken = createRefreshToken();

  const newTokenHash = hashRefreshToken(newRawToken);

  const replacement = await RefreshToken.create({
    userId: user._id,

    tokenHash: newTokenHash,

    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  await RefreshToken.updateOne(
    {
      _id: consumedToken._id,
    },
    {
      $set: {
        replacedByTokenId: replacement._id,
      },
    },
  );

  const accessToken = await createAccessToken(user);

  return {
    user,

    accessToken,

    refreshToken: newRawToken,
  };
}
