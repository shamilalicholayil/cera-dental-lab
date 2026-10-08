import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/logger.js", () => ({
  logger: {
    info: vi.fn(),
  },
}));

import { logger } from "../config/logger.js";

import { requestLogger } from "./requestLogger.js";

describe("requestLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs the request path without query-string values", () => {
    const req = {
      id: "request-123",
      method: "GET",
      path: "/api/v1/lab-slips",

      /*
       * This deliberately contains patient-related
       * search data and must never reach the log.
       */
      originalUrl: "/api/v1/lab-slips?search=Sensitive%20Patient&page=1",
    };

    const res = new EventEmitter();

    res.statusCode = 200;

    const next = vi.fn();

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalledOnce();

    res.emit("finish");

    expect(logger.info).toHaveBeenCalledOnce();

    expect(logger.info).toHaveBeenCalledWith(
      "HTTP request completed",
      expect.objectContaining({
        requestId: "request-123",
        method: "GET",
        path: "/api/v1/lab-slips",
        statusCode: 200,
      }),
    );

    const metadata = logger.info.mock.calls[0][1];

    expect(metadata.path).not.toContain("Sensitive");
    expect(metadata.path).not.toContain("search=");
    expect(metadata.path).not.toContain("?");
  });
});
