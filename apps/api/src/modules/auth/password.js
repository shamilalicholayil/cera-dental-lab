import argon2 from "argon2";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,

  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password) {
  if (typeof password !== "string") {
    throw new TypeError("Password must be a string");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password, passwordHash) {
  if (typeof password !== "string" || typeof passwordHash !== "string") {
    return false;
  }

  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
