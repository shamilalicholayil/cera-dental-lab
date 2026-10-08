import { createHmac, randomBytes } from "node:crypto";

import { env } from "../../config/env.js";

function hashWithSecret(token, secret) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function createInvitationToken() {
  return randomBytes(48).toString("base64url");
}

export function hashInvitationToken(token) {
  return hashWithSecret(token, env.INVITATION_TOKEN_SECRET);
}

export function getInvitationTokenHashCandidates(token) {
  const currentHash = hashInvitationToken(token);

  /*
   * Temporary migration compatibility.
   *
   * Invitations created before Module 7B were hashed using
   * REFRESH_TOKEN_SECRET. Keep accepting those pending tokens
   * until the old invitation TTL window has passed.
   */
  const legacyHash = hashWithSecret(token, env.REFRESH_TOKEN_SECRET);

  if (legacyHash === currentHash) {
    return [currentHash];
  }

  return [currentHash, legacyHash];
}
