import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

function isInvalidJsonError(err) {
  return err instanceof SyntaxError && err.status === 400 && "body" in err;
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode;
  let code;
  let message;
  let isOperational;

  if (isInvalidJsonError(err)) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Invalid JSON payload";
    isOperational = true;
  } else if (err.isOperational === true) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    isOperational = true;
  } else {
    statusCode = 500;
    code = "INTERNAL_SERVER_ERROR";
    message = "Something went wrong";
    isOperational = false;
  }

  const logMetadata = {
    requestId: req.id,
    code,
    statusCode,
    errorName: err.name,
    message: err.message,
  };

  if (statusCode >= 500) {
    logger.error("Unhandled application error", {
      ...logMetadata,
      stack: err.stack,
    });
  } else {
    logger.warn("Application error", logMetadata);
  }

  const response = {
    success: false,
    error: {
      code,
      message,
      requestId: req.id,
    },
  };

  if (env.NODE_ENV === "development" && !isOperational) {
    response.error.debug = err.message;
  }

  res.status(statusCode).json(response);
}
