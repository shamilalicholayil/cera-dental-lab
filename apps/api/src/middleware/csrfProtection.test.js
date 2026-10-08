import { describe, expect, it, vi } from "vitest";

import { createCsrfProtection, isTrustedOrigin } from "./csrfProtection.js";

const TRUSTED_URL = "http://localhost:5173";

function createRequest(method, origin) {
  return {
    method,

    get(headerName) {
      if (headerName.toLowerCase() === "origin") {
        return origin;
      }

      return undefined;
    },
  };
}

function runMiddleware({ method, origin }) {
  const middleware = createCsrfProtection({
    trustedUrl: TRUSTED_URL,
    skip: false,
  });

  const next = vi.fn();

  middleware(createRequest(method, origin), {}, next);

  return next;
}

describe("CSRF origin protection", () => {
  it("recognizes the configured frontend origin", () => {
    expect(isTrustedOrigin("http://localhost:5173", TRUSTED_URL)).toBe(true);
  });

  it("compares URL origins rather than full URLs", () => {
    expect(
      isTrustedOrigin(
        "http://localhost:5173",
        "http://localhost:5173/dashboard",
      ),
    ).toBe(true);
  });

  it("rejects a lookalike origin", () => {
    expect(
      isTrustedOrigin("http://localhost:5173.evil.example", TRUSTED_URL),
    ).toBe(false);
  });

  it("rejects malformed origins", () => {
    expect(isTrustedOrigin("not-a-url", TRUSTED_URL)).toBe(false);
  });

  it.each(["GET", "HEAD", "OPTIONS"])(
    "allows safe %s requests without an Origin header",
    (method) => {
      const next = runMiddleware({
        method,
        origin: undefined,
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    },
  );

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "allows %s from the trusted frontend",
    (method) => {
      const next = runMiddleware({
        method,
        origin: TRUSTED_URL,
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    },
  );

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "rejects %s when Origin is missing",
    (method) => {
      const next = runMiddleware({
        method,
        origin: undefined,
      });

      expect(next).toHaveBeenCalledTimes(1);

      const error = next.mock.calls[0][0];

      expect(error).toMatchObject({
        statusCode: 403,
        code: "CSRF_ORIGIN_REJECTED",
      });
    },
  );

  it("rejects state-changing requests from another origin", () => {
    const next = runMiddleware({
      method: "POST",
      origin: "https://evil.example",
    });

    const error = next.mock.calls[0][0];

    expect(error).toMatchObject({
      statusCode: 403,
      code: "CSRF_ORIGIN_REJECTED",
    });
  });

  it("rejects origin-prefix attacks", () => {
    const next = runMiddleware({
      method: "POST",
      origin: "http://localhost:5173.evil.example",
    });

    const error = next.mock.calls[0][0];

    expect(error).toMatchObject({
      statusCode: 403,
      code: "CSRF_ORIGIN_REJECTED",
    });
  });
});
