import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, screen } from "@testing-library/react";

import App from "./App";
import { getHealth } from "./api/health";

vi.mock("./api/health", () => ({
  getHealth: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("App API connection", () => {
  it("shows API connection success", async () => {
    getHealth.mockResolvedValue({
      success: true,

      data: {
        status: "ok",
      },
    });

    render(<App />);

    expect(screen.getByText("Checking API connection...")).toBeInTheDocument();

    expect(
      await screen.findByText("API connected successfully."),
    ).toBeInTheDocument();
  });

  it("shows an error when API connection fails", async () => {
    getHealth.mockRejectedValue(
      Object.assign(new Error("Unable to reach API"), {
        requestId: "req-test-123",
      }),
    );

    render(<App />);

    expect(
      await screen.findByText("Unable to connect to the API."),
    ).toBeInTheDocument();

    expect(screen.getByText("Unable to reach API")).toBeInTheDocument();

    expect(screen.getByText("Reference: req-test-123")).toBeInTheDocument();
  });
});
