import { describe, expect, it, vi } from "vitest";

import { screen } from "@testing-library/react";

import App from "./App";

import { getHealth } from "./api/health";

import { renderWithStore } from "./test/renderWithStore";

vi.mock("./api/health", () => ({
  getHealth: vi.fn(),
}));

describe("App", () => {
  it("renders the public home route", async () => {
    getHealth.mockResolvedValue({
      success: true,

      data: {
        status: "ok",
      },
    });

    renderWithStore(<App />, {
      route: "/",

      preloadedState: {
        auth: {
          user: null,
          status: "idle",
          restoreStatus: "failed",
          error: null,
        },
      },
    });

    expect(
      await screen.findByText("API connected successfully."),
    ).toBeInTheDocument();
  });
});
