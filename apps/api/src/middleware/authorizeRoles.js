import { USER_ROLE_VALUES } from "@cera/shared";

import { AppError } from "../utils/AppError.js";

const VALID_ROLES = new Set(USER_ROLE_VALUES);

export function authorizeRoles(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error("authorizeRoles requires at least one role");
  }

  for (const role of allowedRoles) {
    if (!VALID_ROLES.has(role)) {
      throw new Error(`Invalid role passed to authorizeRoles: ${role}`);
    }
  }

  const allowed = new Set(allowedRoles);

  return function authorizeRole(req, res, next) {
    if (!req.user) {
      return next(
        new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED"),
      );
    }

    if (!allowed.has(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN",
        ),
      );
    }

    next();
  };
}
