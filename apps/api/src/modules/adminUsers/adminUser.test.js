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

import { hashPassword } from "../auth/password.js";

async function createUser({ name, phone, role }) {
  return User.create({
    name,

    phone,

    passwordHash: await hashPassword("StrongPass123"),

    role,

    status: USER_STATUS.ACTIVE,
  });
}

describe("admin user management", () => {
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

  it("allows admin to list users", async () => {
    await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const agent = request.agent(app);

    await agent
      .post("/api/v1/auth/login")
      .send({
        identifier: "9876543210",

        password: "StrongPass123",
      })
      .expect(200);

    const response = await agent.get("/api/v1/admin/users");

    expect(response.status).toBe(200);

    expect(response.body.data.users).toHaveLength(2);
  });

  it("allows admin to disable another active user", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctor = await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const agent = request.agent(app);

    await agent
      .post("/api/v1/auth/login")
      .send({
        identifier: admin.phone,

        password: "StrongPass123",
      })
      .expect(200);

    const response = await agent.post(
      `/api/v1/admin/users/${doctor.id}/disable`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.user.status).toBe(USER_STATUS.DISABLED);
  });

  it("does not allow admin to disable their own account", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const agent = request.agent(app);

    await agent
      .post("/api/v1/auth/login")
      .send({
        identifier: admin.phone,

        password: "StrongPass123",
      })
      .expect(200);

    const response = await agent.post(
      `/api/v1/admin/users/${admin.id}/disable`,
    );

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("CANNOT_DISABLE_SELF");
  });
});
