import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import {
  CLINIC_STATUS,
  CLINIC_TYPES,
  USER_ROLES,
  USER_STATUS,
} from "@cera/shared";

import { renderWithStore } from "../test/renderWithStore";

import { AdminClinicsPage } from "./AdminClinicsPage";

import {
  activateClinic,
  addClinicMember,
  createClinic,
  disableClinic,
  getAdminClinics,
  getClinicMembers,
  removeClinicMember,
  updateClinic,
} from "../api/clinics";

import { getAdminUsers } from "../api/adminUsers";

vi.mock("../api/clinics", () => ({
  getAdminClinics: vi.fn(),

  getAdminClinic: vi.fn(),

  createClinic: vi.fn(),

  updateClinic: vi.fn(),

  disableClinic: vi.fn(),

  activateClinic: vi.fn(),

  getClinicMembers: vi.fn(),

  addClinicMember: vi.fn(),

  removeClinicMember: vi.fn(),

  getAccessibleClinics: vi.fn(),

  getAccessibleClinic: vi.fn(),
}));

vi.mock("../api/adminUsers", () => ({
  getAdminUsers: vi.fn(),

  disableAdminUser: vi.fn(),

  activateAdminUser: vi.fn(),
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

const clinic = {
  id: "clinic-1",

  name: "Example Dental Clinic",

  type: CLINIC_TYPES.CLINIC,

  contactPhone: "0495 1234567",

  email: "clinic@example.com",

  address: {
    line1: "First Floor, Example Building",

    line2: null,

    locality: "Town Centre",

    city: "Kozhikode",

    district: "Kozhikode",

    state: "Kerala",

    pincode: "673001",

    country: "India",
  },

  status: CLINIC_STATUS.ACTIVE,
};

const clinicsResponse = {
  data: {
    clinics: [clinic],

    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    },
  },
};

describe("AdminClinicsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAdminClinics.mockResolvedValue(clinicsResponse);

    getClinicMembers.mockResolvedValue({
      data: {
        members: [],
      },
    });

    getAdminUsers.mockResolvedValue({
      data: {
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
    });
  });

  it("loads and displays clinics", async () => {
    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    const clinicName = await screen.findByText("Example Dental Clinic");

    expect(screen.getByText(/Clinic · Kozhikode/i)).toBeInTheDocument();

    const clinicCard = clinicName.closest("article");

    expect(within(clinicCard).getByText("Active")).toBeInTheDocument();

    expect(getAdminClinics).toHaveBeenCalledTimes(1);
  });

  it("creates a clinic", async () => {
    createClinic.mockResolvedValue({
      data: {
        clinic,
      },
    });

    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Example Dental Clinic");

    fireEvent.click(
      screen.getByRole("button", {
        name: /add clinic/i,
      }),
    );

    fireEvent.change(screen.getByLabelText("Clinic / hospital name"), {
      target: {
        value: "New Clinic",
      },
    });

    fireEvent.change(screen.getByLabelText("Type"), {
      target: {
        value: CLINIC_TYPES.CLINIC,
      },
    });

    fireEvent.change(screen.getByLabelText("Address line 1"), {
      target: {
        value: "Main Road",
      },
    });

    fireEvent.change(screen.getByLabelText("City"), {
      target: {
        value: "Malappuram",
      },
    });

    fireEvent.change(screen.getByLabelText("State"), {
      target: {
        value: "Kerala",
      },
    });

    fireEvent.change(screen.getByLabelText("Pincode"), {
      target: {
        value: "676505",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create clinic",
      }),
    );

    await waitFor(() => {
      expect(createClinic).toHaveBeenCalledWith({
        name: "New Clinic",

        type: CLINIC_TYPES.CLINIC,

        contactPhone: "",

        email: "",

        address: {
          line1: "Main Road",

          line2: "",

          locality: "",

          city: "Malappuram",

          district: "",

          state: "Kerala",

          pincode: "676505",
        },
      });
    });

    expect(getAdminClinics).toHaveBeenCalledTimes(2);
  });

  it("edits a clinic", async () => {
    updateClinic.mockResolvedValue({
      data: {
        clinic: {
          ...clinic,
          name: "Updated Dental Clinic",
        },
      },
    });

    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Example Dental Clinic");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit",
      }),
    );

    const nameInput = screen.getByLabelText("Clinic / hospital name");

    fireEvent.change(nameInput, {
      target: {
        value: "Updated Dental Clinic",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save changes",
      }),
    );

    await waitFor(() => {
      expect(updateClinic).toHaveBeenCalledWith(
        "clinic-1",
        expect.objectContaining({
          name: "Updated Dental Clinic",
        }),
      );
    });
  });

  it("adds a Doctor as a clinic member", async () => {
    const doctor = {
      id: "doctor-1",

      name: "Dr Example",

      phone: "+919876543211",

      email: "doctor@example.com",

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.ACTIVE,
    };

    getAdminUsers.mockResolvedValue({
      data: {
        users: [doctor],

        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      },
    });

    addClinicMember.mockResolvedValue({
      data: {
        membership: {
          id: "membership-1",

          active: true,

          addedAt: "2026-10-05T00:00:00.000Z",

          removedAt: null,

          user: doctor,
        },
      },
    });

    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Example Dental Clinic");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Members",
      }),
    );

    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByText("No doctors or clinic staff assigned yet."),
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("Search users"), {
      target: {
        value: "Dr Example",
      },
    });

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Search",
      }),
    );

    expect(await within(dialog).findByText("Dr Example")).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Add",
      }),
    );

    await waitFor(() => {
      expect(addClinicMember).toHaveBeenCalledWith("clinic-1", "doctor-1");
    });

    expect(within(dialog).getByText("Dr Example")).toBeInTheDocument();
  });

  it("removes an existing clinic member", async () => {
    getClinicMembers.mockResolvedValue({
      data: {
        members: [
          {
            id: "membership-1",

            active: true,

            user: {
              id: "doctor-1",

              name: "Dr Example",

              phone: "+919876543211",

              role: USER_ROLES.DOCTOR,

              status: USER_STATUS.ACTIVE,
            },
          },
        ],
      },
    });

    removeClinicMember.mockResolvedValue({
      data: {
        membership: {
          id: "membership-1",

          active: false,
        },
      },
    });

    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Example Dental Clinic");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Members",
      }),
    );

    expect(await screen.findByText("Dr Example")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove",
      }),
    );

    await waitFor(() => {
      expect(removeClinicMember).toHaveBeenCalledWith("clinic-1", "doctor-1");
    });

    await waitFor(() => {
      expect(screen.queryByText("Dr Example")).not.toBeInTheDocument();
    });
  });

  it("disables an active clinic", async () => {
    disableClinic.mockResolvedValue({
      data: {
        clinic: {
          ...clinic,

          status: CLINIC_STATUS.DISABLED,
        },
      },
    });

    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Example Dental Clinic");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Disable",
      }),
    );

    const dialog = screen.getByRole("alertdialog");

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Disable",
      }),
    );

    await waitFor(() => {
      expect(disableClinic).toHaveBeenCalledWith("clinic-1");
    });

    expect(getAdminClinics).toHaveBeenCalledTimes(2);
  });

  it("reactivates a disabled clinic", async () => {
    getAdminClinics.mockResolvedValue({
      data: {
        clinics: [
          {
            ...clinic,

            status: CLINIC_STATUS.DISABLED,
          },
        ],

        pagination: clinicsResponse.data.pagination,
      },
    });

    activateClinic.mockResolvedValue({
      data: {
        clinic: {
          ...clinic,

          status: CLINIC_STATUS.ACTIVE,
        },
      },
    });

    renderWithStore(<AdminClinicsPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Example Dental Clinic");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reactivate",
      }),
    );

    const dialog = screen.getByRole("alertdialog");

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Reactivate",
      }),
    );

    await waitFor(() => {
      expect(activateClinic).toHaveBeenCalledWith("clinic-1");
    });
  });
});
