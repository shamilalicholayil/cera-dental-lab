import { AppError } from "../utils/AppError.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid request";

      return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }

    req.body = result.data;

    next();
  };
}
