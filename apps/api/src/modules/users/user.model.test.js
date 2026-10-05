import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "../auth/password.js";

import { User } from "./user.model.js";

describe("User model", () => {
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

  it("creates an active user with normalized phone and email", async () => {
    const passwordHash = await hashPassword("StrongPass123");

    const user = await User.create({
      name: "Test Doctor",

      phone: "+91 98765 43210",

      email: " Doctor@Example.COM ",

      passwordHash,

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.ACTIVE,
    });

    expect(user.phone).toBe("+919876543210");

    expect(user.email).toBe("doctor@example.com");
  });

  it("allows invited users without a password", async () => {
    const user = await User.create({
      name: "Invited Doctor",

      phone: "9876543210",

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.INVITED,
    });

    expect(user.status).toBe(USER_STATUS.INVITED);
  });

  it("does not allow an active user without a password", async () => {
    await expect(
      User.create({
        name: "No Password",

        phone: "9876543210",

        role: USER_ROLES.DOCTOR,

        status: USER_STATUS.ACTIVE,
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid Indian mobile number", async () => {
    await expect(
      User.create({
        name: "Invalid Phone",

        phone: "1234567890",

        role: USER_ROLES.DOCTOR,
      }),
    ).rejects.toThrow();
  });

  it("rejects duplicate phone numbers even when formatting differs", async () => {
    await User.create({
      name: "Doctor One",

      phone: "9876543210",

      role: USER_ROLES.DOCTOR,
    });

    await expect(
      User.create({
        name: "Doctor Two",

        phone: "+91 98765 43210",

        role: USER_ROLES.DOCTOR,
      }),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it("rejects duplicate normalized emails", async () => {
    await User.create({
      name: "Doctor One",

      phone: "9876543210",

      email: "doctor@example.com",

      role: USER_ROLES.DOCTOR,
    });

    await expect(
      User.create({
        name: "Doctor Two",

        phone: "9876543211",

        email: " Doctor@Example.COM ",

        role: USER_ROLES.DOCTOR,
      }),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it("allows multiple users without email addresses", async () => {
    await User.create({
      name: "Doctor One",

      phone: "9876543210",

      role: USER_ROLES.DOCTOR,
    });

    await expect(
      User.create({
        name: "Doctor Two",

        phone: "9876543211",

        role: USER_ROLES.DOCTOR,
      }),
    ).resolves.toBeTruthy();
  });

  it("does not return passwordHash by default", async () => {
    const passwordHash = await hashPassword("StrongPass123");

    const created = await User.create({
      name: "Secure User",

      phone: "9876543210",

      passwordHash,

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.ACTIVE,
    });

    const user = await User.findById(created._id);

    expect(user.passwordHash).toBeUndefined();
  });

  it("can explicitly select passwordHash for authentication", async () => {
    const passwordHash = await hashPassword("StrongPass123");

    const created = await User.create({
      name: "Secure User",

      phone: "9876543210",

      passwordHash,

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.ACTIVE,
    });

    const user = await User.findById(created._id).select("+passwordHash");

    expect(user.passwordHash).toBe(passwordHash);
  });

  it("does not expose passwordHash when serialized", async () => {
    const passwordHash = await hashPassword("StrongPass123");

    const user = await User.create({
      name: "Secure User",

      phone: "9876543210",

      passwordHash,

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.ACTIVE,
    });

    const object = user.toJSON();

    expect(object.passwordHash).toBeUndefined();
  });
});
