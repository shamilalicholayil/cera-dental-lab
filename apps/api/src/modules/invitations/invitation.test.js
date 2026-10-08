import { createHmac, randomBytes } from "node:crypto";

import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { app } from "../../app.js";

import { env } from "../../config/env.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { User } from "../users/user.model.js";

import { hashPassword } from "../auth/password.js";

import { Invitation } from "./invitation.model.js";

async function createAdmin() {
  return User.create({
    name: "Cera Admin",

    phone: "9876543210",

    passwordHash: await hashPassword("StrongPass123"),

    role: USER_ROLES.CERA_ADMIN,

    status: USER_STATUS.ACTIVE,
  });
}

async function loginAdmin(agent) {
  await agent
    .post("/api/v1/auth/login")
    .send({
      identifier: "9876543210",

      password: "StrongPass123",
    })
    .expect(200);
}

describe("invitations", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    await User.syncIndexes();

    await Invitation.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows Cera Admin to create an invitation", async () => {
    await createAdmin();

    const agent = request.agent(app);

    await loginAdmin(agent);

    const response = await agent.post("/api/v1/admin/invitations").send({
      name: "Dr Example",

      phone: "9876543211",

      email: "doctor@example.com",

      role: USER_ROLES.DOCTOR,
    });

    expect(response.status).toBe(201);

    expect(response.body.data.inviteUrl).toContain("/accept-invitation#token=");

    const user = await User.findOne({
      phone: "+919876543211",
    });

    expect(user.status).toBe(USER_STATUS.INVITED);

    const invitation = await Invitation.findOne({
      userId: user._id,
    }).select("+tokenHash");

    expect(invitation.tokenHash).toBeTruthy();

    const rawToken = response.body.data.inviteUrl.split("#token=")[1];

    const expectedInvitationHash = createHmac(
      "sha256",
      env.INVITATION_TOKEN_SECRET,
    )
      .update(rawToken)
      .digest("hex");

    const legacyRefreshHash = createHmac("sha256", env.REFRESH_TOKEN_SECRET)
      .update(rawToken)
      .digest("hex");

    expect(invitation.tokenHash).toBe(expectedInvitationHash);

    expect(invitation.tokenHash).not.toBe(legacyRefreshHash);

    expect(response.body.data.inviteUrl).not.toContain(invitation.tokenHash);
  });

  it("does not allow Doctor to create invitations", async () => {
    await User.create({
      name: "Doctor",

      phone: "9876543212",

      passwordHash: await hashPassword("StrongPass123"),

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.ACTIVE,
    });

    const agent = request.agent(app);

    await agent
      .post("/api/v1/auth/login")
      .send({
        identifier: "9876543212",

        password: "StrongPass123",
      })
      .expect(200);

    const response = await agent.post("/api/v1/admin/invitations").send({
      name: "Another Doctor",

      phone: "9876543213",

      role: USER_ROLES.DOCTOR,
    });

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("previews and accepts an invitation", async () => {
    await createAdmin();

    const admin = request.agent(app);

    await loginAdmin(admin);

    const creation = await admin
      .post("/api/v1/admin/invitations")
      .send({
        name: "Dr Example",

        phone: "9876543211",

        role: USER_ROLES.DOCTOR,
      })
      .expect(201);

    const inviteUrl = creation.body.data.inviteUrl;

    const token = inviteUrl.split("#token=")[1];

    const preview = await request(app)
      .post("/api/v1/invitations/preview")
      .send({
        token,
      });

    expect(preview.status).toBe(200);

    expect(preview.body.data.invitation.name).toBe("Dr Example");

    const acceptance = await request(app)
      .post("/api/v1/invitations/accept")
      .send({
        token,

        password: "DoctorPass123",
      });

    expect(acceptance.status).toBe(200);

    const user = await User.findOne({
      phone: "+919876543211",
    }).select("+passwordHash");

    expect(user.status).toBe(USER_STATUS.ACTIVE);

    expect(user.passwordHash).toBeTruthy();
  });

  it("does not allow the same invitation token to be accepted twice", async () => {
    await createAdmin();

    const admin = request.agent(app);

    await loginAdmin(admin);

    const creation = await admin
      .post("/api/v1/admin/invitations")
      .send({
        name: "Doctor",

        phone: "9876543211",

        role: USER_ROLES.DOCTOR,
      })
      .expect(201);

    const token = creation.body.data.inviteUrl.split("#token=")[1];

    await request(app)
      .post("/api/v1/invitations/accept")
      .send({
        token,

        password: "DoctorPass123",
      })
      .expect(200);

    const second = await request(app).post("/api/v1/invitations/accept").send({
      token,

      password: "AnotherPass123",
    });

    expect(second.status).toBe(400);

    expect(second.body.error.code).toBe("INVITATION_INVALID");
  });

  it("rejects duplicate invited users", async () => {
    await createAdmin();

    const admin = request.agent(app);

    await loginAdmin(admin);

    const payload = {
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    };

    await admin.post("/api/v1/admin/invitations").send(payload).expect(201);

    const response = await admin
      .post("/api/v1/admin/invitations")
      .send(payload);

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("USER_ALREADY_INVITED");
  });

  it("accepts an invitation created with the legacy hashing secret", async () => {
    const admin = await createAdmin();

    const invitedUser = await User.create({
      name: "Legacy Invite Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.INVITED,
    });

    const rawToken = randomBytes(48).toString("base64url");

    const legacyHash = createHmac("sha256", env.REFRESH_TOKEN_SECRET)
      .update(rawToken)
      .digest("hex");

    await Invitation.create({
      userId: invitedUser._id,

      createdByUserId: admin._id,

      tokenHash: legacyHash,

      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(app)
      .post("/api/v1/invitations/preview")
      .send({
        token: rawToken,
      })
      .expect(200);

    await request(app)
      .post("/api/v1/invitations/accept")
      .send({
        token: rawToken,

        password: "DoctorPass123",
      })
      .expect(200);

    const updatedUser = await User.findById(invitedUser._id);

    expect(updatedUser.status).toBe(USER_STATUS.ACTIVE);
  });
});
