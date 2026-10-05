import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, screen, waitFor } from "@testing-library/react";

import { getCurrentUser } from "../../api/auth";

import { AuthInitializer } from "./AuthInitializer";

import { renderWithStore } from "../../test/renderWithStore";

vi.mock("../../api/auth", () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AuthInitializer", () => {
  it("restores an authenticated session", async () => {
    getCurrentUser.mockResolvedValue({
      success: true,

      data: {
        user: {
          id: "user-1",
          name: "Cera Admin",
          role: "CERA_ADMIN",
          status: "ACTIVE",
        },
      },
    });

    const { store } = renderWithStore(
      <AuthInitializer>
        <div>Application</div>
      </AuthInitializer>,
    );

    expect(screen.getByText("Application")).toBeInTheDocument();

    await waitFor(() => {
      expect(store.getState().auth.restoreStatus).toBe("succeeded");
    });

    expect(store.getState().auth.user).toMatchObject({
      name: "Cera Admin",
    });
  });

  it("leaves user unauthenticated when session restoration fails", async () => {
    getCurrentUser.mockRejectedValue(
      Object.assign(new Error("Authentication required"), {
        code: "AUTHENTICATION_REQUIRED",
      }),
    );

    const { store } = renderWithStore(
      <AuthInitializer>
        <div>Application</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(store.getState().auth.restoreStatus).toBe("failed");
    });

    expect(store.getState().auth.user).toBeNull();
  });
});
