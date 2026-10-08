import { logger } from "../config/logger.js";

export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const endedAt = process.hrtime.bigint();

    const durationMs = Number(endedAt - startedAt) / 1_000_000;

    logger.info("HTTP request completed", {
      requestId: req.id,
      method: req.method,

      /*
       * Do not log the query string.
       *
       * Search parameters may contain patient names,
       * patient references, or other operational data.
       */
      path: req.path,

      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
}
