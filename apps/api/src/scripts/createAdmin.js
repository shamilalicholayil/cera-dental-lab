import { input, password } from "@inquirer/prompts";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { connectDatabase, disconnectDatabase } from "../config/database.js";

import { logger } from "../config/logger.js";

import { hashPassword } from "../modules/auth/password.js";

import { User } from "../modules/users/user.model.js";

import {
  isValidEmail,
  normalizeEmail,
  normalizeIndianPhone,
} from "../modules/users/user.utils.js";

async function createAdmin() {
  const name = (
    await input({
      message: "Admin name:",
      required: true,
    })
  ).trim();

  const rawPhone = await input({
    message: "Admin mobile number:",
    required: true,
  });

  const phone = normalizeIndianPhone(rawPhone);

  if (!phone) {
    throw new Error("Invalid Indian mobile number");
  }

  const rawEmail = await input({
    message: "Admin email (optional, press Enter to skip):",
  });

  const email = normalizeEmail(rawEmail);

  if (email !== undefined && !isValidEmail(email)) {
    throw new Error("Invalid email address");
  }

  const plainPassword = await password({
    message: "Admin password (minimum 8 characters):",
    mask: "*",
  });

  if (plainPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const confirmPassword = await password({
    message: "Confirm password:",
    mask: "*",
  });

  if (plainPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const duplicateConditions = [{ phone }];

  if (email) {
    duplicateConditions.push({
      email,
    });
  }

  const existingUser = await User.findOne({
    $or: duplicateConditions,
  });

  if (existingUser) {
    throw new Error("A user with this phone number or email already exists");
  }

  const passwordHash = await hashPassword(plainPassword);

  const admin = await User.create({
    name,
    phone,
    ...(email && { email }),
    passwordHash,

    role: USER_ROLES.CERA_ADMIN,
    status: USER_STATUS.ACTIVE,
  });

  logger.info("Cera admin created successfully", {
    userId: admin.id,
    phone: admin.phone,
  });
}

async function main() {
  try {
    await connectDatabase();

    await createAdmin();
  } catch (error) {
    logger.error("Admin creation failed", {
      error: error.message,
    });

    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

main();
