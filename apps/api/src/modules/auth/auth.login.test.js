import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "./password.js";

import { User } from "../users/user.model.js";

import { RefreshToken } from "./refreshToken.model.js";

describe("POST /api/v1/auth/login", () => {
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

  it("logs in using phone and sets auth cookies", async () => {
    await createActiveUser();

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "+91 98765 43210",

      password: "StrongPass123",
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,

      data: {
        user: {
          name: "Cera Admin",

          phone: "+919876543210",

          role: USER_ROLES.CERA_ADMIN,

          status: USER_STATUS.ACTIVE,
        },
      },
    });

    expect(response.body.data.user.passwordHash).toBeUndefined();

    const cookies = response.headers["set-cookie"];

    expect(cookies).toHaveLength(2);

    expect(cookies.some((cookie) => cookie.startsWith("cera_access="))).toBe(
      true,
    );

    expect(cookies.some((cookie) => cookie.startsWith("cera_refresh="))).toBe(
      true,
    );

    expect(cookies.every((cookie) => cookie.includes("HttpOnly"))).toBe(true);
  });

  it("logs in using normalized email", async () => {
    await createActiveUser();

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: " ADMIN@EXAMPLE.COM ",

      password: "StrongPass123",
    });

    expect(response.status).toBe(200);
  });

  it("stores only a refresh token hash", async () => {
    await createActiveUser();

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "9876543210",

      password: "StrongPass123",
    });

    expect(response.status).toBe(200);

    const token = await RefreshToken.findOne().select("+tokenHash");

    expect(token).toBeTruthy();

    expect(token.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects an incorrect password", async () => {
    await createActiveUser();

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "9876543210",

      password: "WrongPassword",
    });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,

      error: {
        code: "AUTHENTICATION_FAILED",

        message: "Invalid phone/email or password",
      },
    });
  });

  it("returns the same response for an unknown user", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "9876543210",

      password: "WrongPassword",
    });

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("AUTHENTICATION_FAILED");
  });

  it("rejects invited accounts", async () => {
    await User.create({
      name: "Invited Doctor",

      phone: "9876543210",

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.INVITED,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "9876543210",

      password: "Anything123",
    });

    expect(response.status).toBe(401);
  });

  it("rejects disabled accounts", async () => {
    const passwordHash = await hashPassword("StrongPass123");

    await User.create({
      name: "Disabled Doctor",

      phone: "9876543210",

      passwordHash,

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.DISABLED,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "9876543210",

      password: "StrongPass123",
    });

    expect(response.status).toBe(401);
  });

  it("validates missing credentials", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({});

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
