import { describe, expect, it } from "vitest";

import { screen } from "@testing-library/react";

import { USER_ROLES } from "@cera/shared";

import { renderWithStore } from "../test/renderWithStore";

import { RoleGuard } from "./RoleGuard";

function createAuthState(role) {
  return {
    auth: {
      user: role
        ? {
            id: "user-1",
            name: "Test User",
            role,
            status: "ACTIVE",
          }
        : null,

      status: "succeeded",

      restoreStatus: "succeeded",

      error: null,

      logoutStatus: "idle",

      logoutError: null,
    },
  };
}

describe("RoleGuard", () => {
  it("renders children for an allowed role", () => {
    renderWithStore(
      <RoleGuard allowedRoles={[USER_ROLES.CERA_ADMIN]}>
        <button>Manage Users</button>
      </RoleGuard>,
      {
        preloadedState: createAuthState(USER_ROLES.CERA_ADMIN),
      },
    );

    expect(
      screen.getByRole("button", {
        name: "Manage Users",
      }),
    ).toBeInTheDocument();
  });

  it("hides children for a denied role", () => {
    renderWithStore(
      <RoleGuard allowedRoles={[USER_ROLES.CERA_ADMIN]}>
        <button>Manage Users</button>
      </RoleGuard>,
      {
        preloadedState: createAuthState(USER_ROLES.DOCTOR),
      },
    );

    expect(
      screen.queryByRole("button", {
        name: "Manage Users",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders a fallback when role is denied", () => {
    renderWithStore(
      <RoleGuard
        allowedRoles={[USER_ROLES.CERA_ADMIN]}
        fallback={<p>Access denied</p>}
      >
        <div>Admin content</div>
      </RoleGuard>,
      {
        preloadedState: createAuthState(USER_ROLES.DOCTOR),
      },
    );

    expect(screen.getByText("Access denied")).toBeInTheDocument();

    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("does not render protected content without a user", () => {
    renderWithStore(
      <RoleGuard allowedRoles={[USER_ROLES.CERA_ADMIN]}>
        <div>Admin content</div>
      </RoleGuard>,
      {
        preloadedState: createAuthState(null),
      },
    );

    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });
});
