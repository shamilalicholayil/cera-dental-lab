import { AppError } from "../utils/AppError.js";

export function validateQuery(schema) {
  return function validate(req, res, next) {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const issue = result.error.issues[0];

      return next(
        new AppError(
          issue?.message || "Invalid query parameters",
          400,
          "VALIDATION_ERROR",
        ),
      );
    }

    req.validatedQuery = result.data;

    next();
  };
}
