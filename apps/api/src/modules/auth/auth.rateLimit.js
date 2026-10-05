import { rateLimit } from "express-rate-limit";

import { env } from "../../config/env.js";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  skip: () => env.NODE_ENV === "test",

  handler(req, res) {
    res.status(429).json({
      success: false,

      error: {
        code: "TOO_MANY_LOGIN_ATTEMPTS",

        message: "Too many login attempts. Please try again later.",

        requestId: req.id,
      },
    });
  },
});
