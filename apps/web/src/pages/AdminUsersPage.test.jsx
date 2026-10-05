import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { renderWithStore } from "../test/renderWithStore";

import { AdminUsersPage } from "./AdminUsersPage";

import {
  activateAdminUser,
  disableAdminUser,
  getAdminUsers,
} from "../api/adminUsers";

import { createInvitation, getInvitations } from "../api/invitations";

vi.mock("../api/adminUsers", () => ({
  getAdminUsers: vi.fn(),

  disableAdminUser: vi.fn(),

  activateAdminUser: vi.fn(),
}));

vi.mock("../api/invitations", () => ({
  getInvitations: vi.fn(),

  createInvitation: vi.fn(),

  revokeInvitation: vi.fn(),

  regenerateInvitation: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

const adminState = {
  auth: {
    user: {
      id: "admin-1",

      name: "Cera Admin",

      phone: "+919876543210",

      email: null,

      role: USER_ROLES.CERA_ADMIN,

      status: USER_STATUS.ACTIVE,
    },

    status: "succeeded",

    restoreStatus: "succeeded",

    error: null,

    logoutStatus: "idle",

    logoutError: null,
  },
};

const usersResponse = {
  data: {
    users: [
      {
        id: "doctor-1",

        name: "Dr Example",

        phone: "+919876543211",

        email: "doctor@example.com",

        role: USER_ROLES.DOCTOR,

        status: USER_STATUS.ACTIVE,
      },
    ],

    pagination: {
      page: 1,

      limit: 20,

      total: 1,

      pages: 1,
    },
  },
};

async function getUsersTable() {
  const table = await screen.findByRole("table");

  return within(table);
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAdminUsers.mockResolvedValue(usersResponse);

    getInvitations.mockResolvedValue({
      data: {
        invitations: [],
      },
    });
  });

  it("loads and displays users", async () => {
    renderWithStore(<AdminUsersPage />, {
      preloadedState: adminState,
    });

    const table = await getUsersTable();

    expect(table.getByText("Dr Example")).toBeInTheDocument();

    expect(
      table.getByText("doctor@example.com", {
        exact: false,
      }),
    ).toBeInTheDocument();

    expect(table.getByText("Doctor")).toBeInTheDocument();

    expect(table.getByText("Active")).toBeInTheDocument();

    expect(getAdminUsers).toHaveBeenCalledTimes(1);
  });

  it("loads invitations when the Invitations tab is selected", async () => {
    getInvitations.mockResolvedValue({
      data: {
        invitations: [
          {
            id: "invite-1",

            status: "PENDING",

            createdAt: "2026-10-05T00:00:00.000Z",

            expiresAt: "2026-10-08T00:00:00.000Z",

            user: {
              id: "doctor-2",

              name: "Dr Invited",

              phone: "+919876543212",

              role: USER_ROLES.DOCTOR,

              status: USER_STATUS.INVITED,
            },
          },
        ],
      },
    });

    renderWithStore(<AdminUsersPage />, {
      preloadedState: adminState,
    });

    await getUsersTable();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Invitations",
      }),
    );

    expect(await screen.findByText("Dr Invited")).toBeInTheDocument();

    expect(screen.getByText("Pending")).toBeInTheDocument();

    expect(getInvitations).toHaveBeenCalled();
  });

  it("creates a new invitation", async () => {
    createInvitation.mockResolvedValue({
      data: {
        invitation: {
          id: "invite-1",
        },

        inviteUrl: "http://localhost:5173/accept-invitation#token=test-token",
      },
    });

    renderWithStore(<AdminUsersPage />, {
      preloadedState: adminState,
    });

    await getUsersTable();

    fireEvent.click(
      screen.getByRole("button", {
        name: /invite user/i,
      }),
    );

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: {
        value: "Dr New User",
      },
    });

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: {
        value: "9876543213",
      },
    });

    fireEvent.change(screen.getByLabelText("Role"), {
      target: {
        value: USER_ROLES.DOCTOR,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create invitation",
      }),
    );

    await waitFor(() => {
      expect(createInvitation).toHaveBeenCalledWith({
        name: "Dr New User",

        phone: "9876543213",

        email: "",

        role: USER_ROLES.DOCTOR,
      });
    });

    expect(await screen.findByText("Invitation ready")).toBeInTheDocument();
  });

  it("disables an active user", async () => {
    disableAdminUser.mockResolvedValue({
      data: {
        user: {
          ...usersResponse.data.users[0],

          status: USER_STATUS.DISABLED,
        },
      },
    });

    renderWithStore(<AdminUsersPage />, {
      preloadedState: adminState,
    });

    const table = await getUsersTable();

    fireEvent.click(
      table.getByRole("button", {
        name: "Disable",
      }),
    );

    const dialog = screen.getByRole("alertdialog");

    expect(within(dialog).getByText("Disable account?")).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Disable",
      }),
    );

    await waitFor(() => {
      expect(disableAdminUser).toHaveBeenCalledWith("doctor-1");
    });

    expect(getAdminUsers).toHaveBeenCalledTimes(2);
  });

  it("reactivates a disabled user", async () => {
    getAdminUsers.mockResolvedValue({
      data: {
        users: [
          {
            ...usersResponse.data.users[0],

            status: USER_STATUS.DISABLED,
          },
        ],

        pagination: usersResponse.data.pagination,
      },
    });

    activateAdminUser.mockResolvedValue({
      data: {
        user: {
          ...usersResponse.data.users[0],

          status: USER_STATUS.ACTIVE,
        },
      },
    });

    renderWithStore(<AdminUsersPage />, {
      preloadedState: adminState,
    });

    const table = await getUsersTable();

    fireEvent.click(
      table.getByRole("button", {
        name: "Reactivate",
      }),
    );

    const dialog = screen.getByRole("alertdialog");

    expect(within(dialog).getByText("Reactivate account?")).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Reactivate",
      }),
    );

    await waitFor(() => {
      expect(activateAdminUser).toHaveBeenCalledWith("doctor-1");
    });
  });
});
