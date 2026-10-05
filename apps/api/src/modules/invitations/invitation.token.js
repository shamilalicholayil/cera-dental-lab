import { createHmac, randomBytes } from "node:crypto";

import { env } from "../../config/env.js";

export function createInvitationToken() {
  return randomBytes(48).toString("base64url");
}

export function hashInvitationToken(token) {
  return createHmac("sha256", env.REFRESH_TOKEN_SECRET)
    .update(token)
    .digest("hex");
}
