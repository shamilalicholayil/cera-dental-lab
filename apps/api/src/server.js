import { app } from "./app.js";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

import { connectDatabase, disconnectDatabase } from "./config/database.js";

let server;

function getLifecycleErrorMetadata(error) {
  const metadata = {
    errorName: error?.name || "Error",
  };

  /*
   * Keep detailed diagnostics during local development,
   * but do not copy arbitrary provider/database error
   * messages or stacks into production logs.
   */
  if (env.NODE_ENV !== "production") {
    metadata.message = error?.message || "Unknown error";
    metadata.stack = error?.stack;
  }

  return metadata;
}

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      logger.info("Cera API started", {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.error(
      "Application startup failed",
      getLifecycleErrorMetadata(error),
    );

    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info("Shutdown signal received", {
    signal,
  });

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      logger.info("HTTP server closed");
    }

    await disconnectDatabase();

    process.exit(0);
  } catch (error) {
    logger.error("Graceful shutdown failed", getLifecycleErrorMetadata(error));

    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

startServer();
