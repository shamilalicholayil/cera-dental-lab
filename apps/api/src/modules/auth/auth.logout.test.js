import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { User } from "../users/user.model.js";

import { hashPassword } from "./password.js";

import { RefreshToken } from "./refreshToken.model.js";

async function createActiveUser() {
  const passwordHash = await hashPassword("StrongPass123");

  return User.create({
    name: "Cera Admin",

    phone: "9876543210",

    email: "admin@example.com",

    passwordHash,

    role: USER_ROLES.CERA_ADMIN,

    status: USER_STATUS.ACTIVE,
  });
}

describe("POST /api/v1/auth/logout", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    await User.syncIndexes();

    await RefreshToken.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("revokes the current refresh token and clears authentication", async () => {
    await createActiveUser();

    const agent = request.agent(app);

    await agent
      .post("/api/v1/auth/login")
      .send({
        identifier: "9876543210",

        password: "StrongPass123",
      })
      .expect(200);

    const activeToken = await RefreshToken.findOne({
      revokedAt: null,
    });

    expect(activeToken).toBeTruthy();

    const logoutResponse = await agent.post("/api/v1/auth/logout");

    expect(logoutResponse.status).toBe(200);

    expect(logoutResponse.body).toMatchObject({
      success: true,

      data: {
        message: "Signed out successfully",
      },
    });

    const revokedToken = await RefreshToken.findById(activeToken._id);

    expect(revokedToken.revokedAt).toBeTruthy();

    const meResponse = await agent.get("/api/v1/auth/me");

    expect(meResponse.status).toBe(401);
  });

  it("is safe when no refresh token exists", async () => {
    const response = await request(app).post("/api/v1/auth/logout");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
    });
  });

  it("does not revoke another active session", async () => {
    await createActiveUser();

    const firstDevice = request.agent(app);

    const secondDevice = request.agent(app);

    const credentials = {
      identifier: "9876543210",

      password: "StrongPass123",
    };

    await firstDevice.post("/api/v1/auth/login").send(credentials).expect(200);

    await secondDevice.post("/api/v1/auth/login").send(credentials).expect(200);

    expect(
      await RefreshToken.countDocuments({
        revokedAt: null,
      }),
    ).toBe(2);

    await firstDevice.post("/api/v1/auth/logout").expect(200);

    expect(
      await RefreshToken.countDocuments({
        revokedAt: null,
      }),
    ).toBe(1);

    await secondDevice.get("/api/v1/auth/me").expect(200);
  });
});
