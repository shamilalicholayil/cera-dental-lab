import { RefreshToken } from "./refreshToken.model.js";

import { hashRefreshToken } from "./token.js";

export async function revokeRefreshToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    return false;
  }

  const tokenHash = hashRefreshToken(rawToken);

  const result = await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );

  return Boolean(result);
}
