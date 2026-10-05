import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, screen, waitFor } from "@testing-library/react";

import { USER_ROLES } from "@cera/shared";

import { renderWithStore } from "../test/renderWithStore";

import { AcceptInvitationPage } from "./AcceptInvitationPage";

import { acceptInvitation, previewInvitation } from "../api/invitations";

vi.mock("../api/invitations", () => ({
  previewInvitation: vi.fn(),

  acceptInvitation: vi.fn(),

  getInvitations: vi.fn(),

  createInvitation: vi.fn(),

  revokeInvitation: vi.fn(),

  regenerateInvitation: vi.fn(),
}));

const validToken = "test-invitation-token-abcdefghijklmnopqrstuvwxyz";

function setInvitationUrl(token = validToken) {
  window.history.pushState({}, "", `/accept-invitation#token=${token}`);
}

describe("AcceptInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.history.pushState({}, "", "/");
  });

  it("loads valid invitation information", async () => {
    previewInvitation.mockResolvedValue({
      data: {
        invitation: {
          name: "Dr Example",

          role: USER_ROLES.DOCTOR,

          phone: "+91******211",

          expiresAt: "2026-10-08T00:00:00.000Z",
        },
      },
    });

    setInvitationUrl();

    renderWithStore(<AcceptInvitationPage />);

    expect(await screen.findByText("Dr Example")).toBeInTheDocument();

    expect(screen.getByText("Doctor")).toBeInTheDocument();

    expect(previewInvitation).toHaveBeenCalledWith(validToken);
  });

  it("rejects passwords shorter than 8 characters", async () => {
    previewInvitation.mockResolvedValue({
      data: {
        invitation: {
          name: "Dr Example",

          role: USER_ROLES.DOCTOR,

          phone: "+91******211",
        },
      },
    });

    setInvitationUrl();

    renderWithStore(<AcceptInvitationPage />);

    await screen.findByText("Dr Example");

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "short",
      },
    });

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: {
        value: "short",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Activate account",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Password must contain at least 8 characters.",
    );

    expect(acceptInvitation).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    previewInvitation.mockResolvedValue({
      data: {
        invitation: {
          name: "Dr Example",

          role: USER_ROLES.DOCTOR,

          phone: "+91******211",
        },
      },
    });

    setInvitationUrl();

    renderWithStore(<AcceptInvitationPage />);

    await screen.findByText("Dr Example");

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "StrongPass123",
      },
    });

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: {
        value: "DifferentPass123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Activate account",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );

    expect(acceptInvitation).not.toHaveBeenCalled();
  });

  it("activates an invited account successfully", async () => {
    previewInvitation.mockResolvedValue({
      data: {
        invitation: {
          name: "Dr Example",

          role: USER_ROLES.DOCTOR,

          phone: "+91******211",
        },
      },
    });

    acceptInvitation.mockResolvedValue({
      data: {
        message: "Account activated successfully",
      },
    });

    setInvitationUrl();

    renderWithStore(<AcceptInvitationPage />);

    await screen.findByText("Dr Example");

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "StrongPass123",
      },
    });

    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: {
        value: "StrongPass123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Activate account",
      }),
    );

    await waitFor(() => {
      expect(acceptInvitation).toHaveBeenCalledWith({
        token: validToken,

        password: "StrongPass123",
      });
    });

    expect(
      await screen.findByText("You're ready to use Cera."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Continue to sign in",
      }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows an unavailable state for an invalid invitation", async () => {
    previewInvitation.mockRejectedValue(new Error("Invalid invitation"));

    setInvitationUrl();

    renderWithStore(<AcceptInvitationPage />);

    expect(
      await screen.findByText("Invitation unavailable"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/invalid, expired, revoked, or has already been used/i),
    ).toBeInTheDocument();
  });

  it("rejects a link without an invitation token", async () => {
    window.history.pushState({}, "", "/accept-invitation");

    renderWithStore(<AcceptInvitationPage />);

    expect(
      await screen.findByText("Invitation unavailable"),
    ).toBeInTheDocument();

    expect(previewInvitation).not.toHaveBeenCalled();
  });
});
