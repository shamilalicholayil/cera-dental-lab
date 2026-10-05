import { createHmac, randomBytes } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";

import { env } from "../../config/env.js";

import { ACCESS_TOKEN_TTL_SECONDS } from "./auth.constants.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export async function createAccessToken(user) {
  return new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(user.id)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS)
    .sign(accessSecret);
}

export async function verifyAccessToken(token) {
  const result = await jwtVerify(token, accessSecret, {
    issuer: env.JWT_ISSUER,

    audience: env.JWT_AUDIENCE,

    algorithms: ["HS256"],
  });

  return result.payload;
}

export function createRefreshToken() {
  return randomBytes(64).toString("base64url");
}

export function hashRefreshToken(token) {
  return createHmac("sha256", env.REFRESH_TOKEN_SECRET)
    .update(token)
    .digest("hex");
}
