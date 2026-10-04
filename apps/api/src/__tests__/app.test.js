import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app.js";

describe("API foundation", () => {
  it("returns 404 for an unknown route", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
      },
    });

    expect(response.body.error.requestId).toBeTruthy();

    expect(response.headers["x-request-id"]).toBe(
      response.body.error.requestId,
    );
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send('{"broken":');

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON payload",
      },
    });
  });
});
