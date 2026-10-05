import { describe, expect, it } from "vitest";

import {
  isValidIndianPhone,
  normalizeEmail,
  normalizeIndianPhone,
} from "./user.utils.js";

describe("user utilities", () => {
  describe("normalizeIndianPhone", () => {
    it.each([
      ["9876543210", "+919876543210"],

      ["09876543210", "+919876543210"],

      ["919876543210", "+919876543210"],

      ["+91 98765 43210", "+919876543210"],

      ["0091 9876543210", "+919876543210"],
    ])("normalizes %s", (input, expected) => {
      expect(normalizeIndianPhone(input)).toBe(expected);
    });

    it.each(["", "12345", "1234567890", "abc9876543210", "+1 9876543210"])(
      "rejects invalid phone %s",
      (input) => {
        expect(isValidIndianPhone(input)).toBe(false);
      },
    );
  });

  describe("normalizeEmail", () => {
    it("normalizes email casing and whitespace", () => {
      expect(normalizeEmail("  Doctor@Example.COM ")).toBe(
        "doctor@example.com",
      );
    });

    it("returns undefined for blank optional email", () => {
      expect(normalizeEmail("   ")).toBeUndefined();
    });
  });
});
