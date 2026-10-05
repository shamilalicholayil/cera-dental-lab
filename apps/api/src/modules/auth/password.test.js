import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password.js";

describe("password security", () => {
  it("hashes a password", async () => {
    const hash = await hashPassword("StrongPass123");

    expect(hash).not.toBe("StrongPass123");

    expect(hash).toContain("$argon2id$");
  });

  it("produces different hashes for the same password", async () => {
    const first = await hashPassword("StrongPass123");

    const second = await hashPassword("StrongPass123");

    expect(first).not.toBe(second);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("StrongPass123");

    await expect(verifyPassword("StrongPass123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("StrongPass123");

    await expect(verifyPassword("WrongPassword", hash)).resolves.toBe(false);
  });

  it("rejects malformed hashes safely", async () => {
    await expect(
      verifyPassword("StrongPass123", "not-a-valid-hash"),
    ).resolves.toBe(false);
  });

  it("rejects passwords shorter than 8 characters", async () => {
    await expect(hashPassword("short")).rejects.toThrow(
      "Password must be at least 8 characters long",
    );
  });
});
