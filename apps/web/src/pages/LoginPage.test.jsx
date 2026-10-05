import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { LoginPage } from "./LoginPage";

import { loginUser } from "../api/auth";

import { renderWithStore } from "../test/renderWithStore";

vi.mock("../api/auth", () => ({
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("validates empty credentials", async () => {
    renderWithStore(<LoginPage />, {
      route: "/login",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter your phone number or email.",
    );

    expect(loginUser).not.toHaveBeenCalled();
  });

  it("validates missing password", async () => {
    renderWithStore(<LoginPage />, {
      route: "/login",
    });

    fireEvent.change(screen.getByLabelText("Phone number or email"), {
      target: {
        value: "9876543210",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter your password.",
    );
  });

  it("submits credentials through Redux", async () => {
    loginUser.mockResolvedValue({
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

    const { store } = renderWithStore(<LoginPage />, {
      route: "/login",
    });

    fireEvent.change(screen.getByLabelText("Phone number or email"), {
      target: {
        value: "9876543210",
      },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "StrongPass123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        identifier: "9876543210",

        password: "StrongPass123",
      });

      expect(store.getState().auth.user).toMatchObject({
        name: "Cera Admin",

        role: "CERA_ADMIN",
      });

      expect(store.getState().auth.status).toBe("succeeded");
    });
  });

  it("shows authentication failure", async () => {
    loginUser.mockRejectedValue(
      Object.assign(new Error("Invalid phone/email or password"), {
        code: "AUTHENTICATION_FAILED",
      }),
    );

    renderWithStore(<LoginPage />, {
      route: "/login",
    });

    fireEvent.change(screen.getByLabelText("Phone number or email"), {
      target: {
        value: "9876543210",
      },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "WrongPassword",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The phone number, email, or password is incorrect.",
    );
  });

  it("shows network failure", async () => {
    loginUser.mockRejectedValue(
      Object.assign(new Error("Unable to reach the server"), {
        code: "NETWORK_ERROR",
      }),
    );

    renderWithStore(<LoginPage />, {
      route: "/login",
    });

    fireEvent.change(screen.getByLabelText("Phone number or email"), {
      target: {
        value: "9876543210",
      },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "StrongPass123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach Cera right now",
    );
  });

  it("allows password visibility toggle", () => {
    renderWithStore(<LoginPage />, {
      route: "/login",
    });

    const input = screen.getByLabelText("Password");

    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show password",
      }),
    );

    expect(input).toHaveAttribute("type", "text");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide password",
      }),
    );

    expect(input).toHaveAttribute("type", "password");
  });
});
