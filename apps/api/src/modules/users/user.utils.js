import { z } from "zod";

const emailSchema = z.string().email();

export function normalizeIndianPhone(value) {
  if (typeof value !== "string") {
    return null;
  }

  const input = value.trim();

  if (!input) {
    return null;
  }

  const allowedCharacters = /^[+\d\s()-]+$/;

  if (!allowedCharacters.test(input)) {
    return null;
  }

  let digits = input.replace(/\D/g, "");

  if (digits.length === 14 && digits.startsWith("0091")) {
    digits = digits.slice(4);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }

  return `+91${digits}`;
}

export function isValidIndianPhone(value) {
  return normalizeIndianPhone(value) !== null;
}

export function normalizeEmail(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return normalized;
}

export function isValidEmail(value) {
  if (value === undefined) {
    return true;
  }

  return emailSchema.safeParse(value).success;
}
