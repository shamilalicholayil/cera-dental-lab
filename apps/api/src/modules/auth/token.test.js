import { describe, expect, it } from "vitest";

import { USER_ROLES } from "@cera/shared";

import { createAccessToken, verifyAccessToken } from "./token.js";

describe("access tokens", () => {
  it("creates a valid access token with a future expiration", async () => {
    const user = {
      id: "507f1f77bcf86cd799439011",
      role: USER_ROLES.CERA_ADMIN,
    };

    const token = await createAccessToken(user);

    const payload = await verifyAccessToken(token);

    const now = Math.floor(Date.now() / 1000);

    expect(payload.sub).toBe(user.id);

    expect(payload.role).toBe(USER_ROLES.CERA_ADMIN);

    expect(payload.exp).toBeGreaterThan(now);

    expect(payload.exp - payload.iat).toBe(15 * 60);
  });
});
