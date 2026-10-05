import express from "express";

import cookieParser from "cookie-parser";

import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { authenticate } from "./authenticate.js";

import { authorizeRoles } from "./authorizeRoles.js";

import { errorHandler } from "./errorHandler.js";

import { requestId } from "./requestId.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../__tests__/helpers/testDatabase.js";

import { User } from "../modules/users/user.model.js";

import { hashPassword } from "../modules/auth/password.js";

import { createAccessToken } from "../modules/auth/token.js";

import { ACCESS_TOKEN_COOKIE } from "../modules/auth/auth.constants.js";

function createTestApp(...allowedRoles) {
  const app = express();

  app.use(requestId);

  app.use(cookieParser());

  app.get(
    "/protected",
    authenticate,
    authorizeRoles(...allowedRoles),
    (req, res) => {
      res.status(200).json({
        success: true,

        data: {
          userId: req.user.id,

          role: req.user.role,
        },
      });
    },
  );

  app.use(errorHandler);

  return app;
}

async function createUser(role) {
  const passwordHash = await hashPassword("StrongPass123");

  return User.create({
    name: `${role} User`,

    phone: role === USER_ROLES.CERA_ADMIN ? "9876543210" : "9876543211",

    passwordHash,

    role,

    status: USER_STATUS.ACTIVE,
  });
}

async function createAccessCookie(user) {
  const token = await createAccessToken(user);

  return `${ACCESS_TOKEN_COOKIE}=${token}`;
}

describe("role authorization integration", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    await User.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows an authorized role", async () => {
    const user = await createUser(USER_ROLES.CERA_ADMIN);

    const cookie = await createAccessCookie(user);

    const app = createTestApp(USER_ROLES.CERA_ADMIN);

    const response = await request(app).get("/protected").set("Cookie", cookie);

    expect(response.status).toBe(200);

    expect(response.body.data.role).toBe(USER_ROLES.CERA_ADMIN);
  });

  it("rejects an authenticated but unauthorized role", async () => {
    const doctor = await createUser(USER_ROLES.DOCTOR);

    const cookie = await createAccessCookie(doctor);

    const app = createTestApp(USER_ROLES.CERA_ADMIN);

    const response = await request(app).get("/protected").set("Cookie", cookie);

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects an unauthenticated request before role authorization", async () => {
    const app = createTestApp(USER_ROLES.CERA_ADMIN);

    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
