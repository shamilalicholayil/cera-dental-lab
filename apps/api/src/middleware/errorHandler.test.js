import { describe, expect, it } from "vitest";

import { buildErrorLogMetadata } from "./errorHandler.js";

describe("errorHandler logging privacy", () => {
  it("does not include raw exception details in production-style metadata", () => {
    const error = new Error(
      "mongodb://admin:secret@example.internal/private-database",
    );

    error.name = "MongoServerError";

    const metadata = buildErrorLogMetadata({
      err: error,
      requestId: "request-123",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      includeDebugDetails: false,
    });

    expect(metadata).toEqual({
      requestId: "request-123",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      errorName: "MongoServerError",
    });

    expect(metadata).not.toHaveProperty("message");
    expect(metadata).not.toHaveProperty("stack");
  });

  it("keeps exception details available for local debugging", () => {
    const error = new Error("Development debugging detail");

    const metadata = buildErrorLogMetadata({
      err: error,
      requestId: "request-456",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      includeDebugDetails: true,
    });

    expect(metadata).toMatchObject({
      requestId: "request-456",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      errorName: "Error",
      message: "Development debugging detail",
    });

    expect(metadata.stack).toEqual(expect.any(String));
  });

  it("does not attach a stack to non-server errors", () => {
    const error = new Error("Validation detail");

    const metadata = buildErrorLogMetadata({
      err: error,
      requestId: "request-789",
      code: "INVALID_INPUT",
      statusCode: 400,
      includeDebugDetails: true,
    });

    expect(metadata.message).toBe("Validation detail");
    expect(metadata).not.toHaveProperty("stack");
  });
});
