import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { logoutUser } from "../../api/auth";

import { renderWithStore } from "../../test/renderWithStore";

import { UserMenu } from "./UserMenu";

vi.mock("../../api/auth", () => ({
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}));

afterEach(() => {
  cleanup();

  vi.clearAllMocks();
});

const authenticatedState = {
  auth: {
    user: {
      id: "user-1",

      name: "Cera Admin",

      role: "CERA_ADMIN",

      status: "ACTIVE",
    },

    status: "succeeded",

    restoreStatus: "succeeded",

    error: null,

    logoutStatus: "idle",

    logoutError: null,
  },
};

describe("UserMenu", () => {
  it("shows current user information", () => {
    renderWithStore(<UserMenu />, {
      preloadedState: authenticatedState,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open account menu",
      }),
    );

    expect(screen.getAllByText("Cera Admin").length).toBeGreaterThan(0);
  });

  it("logs out the current session", async () => {
    logoutUser.mockResolvedValue({
      success: true,

      data: {
        message: "Signed out successfully",
      },
    });

    const { store } = renderWithStore(<UserMenu />, {
      preloadedState: authenticatedState,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open account menu",
      }),
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Sign out",
      }),
    );

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalledTimes(1);

      expect(store.getState().auth.user).toBeNull();

      expect(store.getState().auth.logoutStatus).toBe("succeeded");
    });
  });

  it("keeps the user authenticated when logout fails", async () => {
    logoutUser.mockRejectedValue(
      Object.assign(new Error("Network failure"), {
        code: "NETWORK_ERROR",
      }),
    );

    const { store } = renderWithStore(<UserMenu />, {
      preloadedState: authenticatedState,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open account menu",
      }),
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Sign out",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't sign you out.",
    );

    expect(store.getState().auth.user).toMatchObject({
      name: "Cera Admin",
    });
  });
});
