import { describe, expect, it, vi } from "vitest";

import { USER_ROLES } from "@cera/shared";

import { authorizeRoles } from "./authorizeRoles.js";

function createResponse() {
  return {};
}

describe("authorizeRoles", () => {
  it("allows an authenticated user with an allowed role", () => {
    const req = {
      user: {
        role: USER_ROLES.CERA_ADMIN,
      },
    };

    const res = createResponse();

    const next = vi.fn();

    const middleware = authorizeRoles(USER_ROLES.CERA_ADMIN);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith();
  });

  it("allows any role included in the allowed list", () => {
    const req = {
      user: {
        role: USER_ROLES.CERA_STAFF,
      },
    };

    const next = vi.fn();

    const middleware = authorizeRoles(
      USER_ROLES.CERA_ADMIN,
      USER_ROLES.CERA_STAFF,
    );

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("returns FORBIDDEN for an authenticated user without permission", () => {
    const req = {
      user: {
        role: USER_ROLES.DOCTOR,
      },
    };

    const next = vi.fn();

    const middleware = authorizeRoles(USER_ROLES.CERA_ADMIN);

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(403);

    expect(error.code).toBe("FORBIDDEN");
  });

  it("returns authentication required when req.user is missing", () => {
    const next = vi.fn();

    const middleware = authorizeRoles(USER_ROLES.CERA_ADMIN);

    middleware({}, {}, next);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(401);

    expect(error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  it("rejects an invalid role during configuration", () => {
    expect(() => authorizeRoles("NOT_A_REAL_ROLE")).toThrow(
      "Invalid role passed to authorizeRoles",
    );
  });

  it("requires at least one allowed role", () => {
    expect(() => authorizeRoles()).toThrow(
      "authorizeRoles requires at least one role",
    );
  });
});
