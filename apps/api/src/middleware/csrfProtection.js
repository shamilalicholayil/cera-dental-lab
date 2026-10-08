import { env } from "../config/env.js";

import { AppError } from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeOrigin(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(requestOrigin, trustedUrl = env.CLIENT_URL) {
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  const normalizedTrustedOrigin = normalizeOrigin(trustedUrl);

  return Boolean(
    normalizedRequestOrigin &&
    normalizedTrustedOrigin &&
    normalizedRequestOrigin === normalizedTrustedOrigin,
  );
}

export function createCsrfProtection({
  trustedUrl = env.CLIENT_URL,
  skip = env.NODE_ENV === "test",
} = {}) {
  return function csrfProtection(req, res, next) {
    const method = String(req.method || "").toUpperCase();

    if (skip || SAFE_METHODS.has(method)) {
      return next();
    }

    const origin = req.get("origin");

    if (!isTrustedOrigin(origin, trustedUrl)) {
      return next(
        new AppError(
          "Request origin is not allowed",
          403,
          "CSRF_ORIGIN_REJECTED",
        ),
      );
    }

    return next();
  };
}

export const csrfProtection = createCsrfProtection();
