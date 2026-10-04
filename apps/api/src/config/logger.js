import winston from "winston";

import { env } from "./env.js";

const isTest = env.NODE_ENV === "test" || Boolean(process.env.VITEST);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const meta =
      Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : "";

    return `${timestamp} ${level}: ${message}${meta}`;
  }),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({
    stack: true,
  }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",

  silent: isTest,

  format: env.NODE_ENV === "production" ? productionFormat : developmentFormat,

  transports: [new winston.transports.Console()],
});
