import { rateLimit } from "express-rate-limit";

import { env } from "../../config/env.js";

function invitationRateLimiter({ limit, code, message }) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,

    limit,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    skip: () => env.NODE_ENV === "test",

    handler(req, res) {
      res.status(429).json({
        success: false,

        error: {
          code,
          message,
          requestId: req.id,
        },
      });
    },
  });
}

export const invitationPreviewRateLimiter = invitationRateLimiter({
  limit: 30,

  code: "TOO_MANY_INVITATION_PREVIEWS",

  message: "Too many invitation attempts. Please try again later.",
});

export const invitationAcceptRateLimiter = invitationRateLimiter({
  limit: 10,

  code: "TOO_MANY_INVITATION_ACCEPT_ATTEMPTS",

  message: "Too many invitation attempts. Please try again later.",
});
