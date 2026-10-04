import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info("MongoDB connected", {
      database: mongoose.connection.name,
    });
  } catch (error) {
    logger.error("MongoDB connection failed", {
      error: error.message,
    });

    throw error;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();

  logger.info("MongoDB disconnected");
}

export function getDatabaseStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: states[mongoose.connection.readyState] ?? "unknown",

    ready: mongoose.connection.readyState === 1,
  };
}
