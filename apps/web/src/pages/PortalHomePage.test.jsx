import { render, screen, waitFor, within } from "@testing-library/react";

import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";

import { MemoryRouter } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CORRECTION_STATUS,
  SCAN_BOOKING_STATUS,
  USER_ROLES,
} from "@cera/shared";

import { PortalHomePage } from "./PortalHomePage";

import { getCorrections } from "../api/corrections";

import { getLabSlips } from "../api/labSlips";

import { getScanBookings } from "../api/scanBookings";

vi.mock("../api/corrections", () => ({
  getCorrections: vi.fn(),
}));

vi.mock("../api/labSlips", () => ({
  getLabSlips: vi.fn(),
}));

vi.mock("../api/scanBookings", () => ({
  getScanBookings: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

const doctor = {
  id: "doctor-1",
  name: "Dr Example",
  phone: "+919876543210",
  email: "doctor@example.com",
  role: USER_ROLES.DOCTOR,
  status: "ACTIVE",
};

const recentLabSlip = {
  id: "slip-1",
  reference: "CDL-2026-000001",
  urgency: "URGENT",

  patient: {
    name: "Recent Patient",
  },

  clinic: {
    id: "clinic-1",
    name: "Cera Test Clinic",
  },

  createdAt: "2026-10-05T10:00:00.000Z",
};

const scanAwaitingConfirmation = {
  id: "scan-1",
  reference: "SCAN-001",
  status: SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,

  labSlip: {
    patient: {
      name: "Confirmation Patient",
    },
  },

  clinic: {
    id: "clinic-1",
    name: "Cera Test Clinic",
  },

  proposedStartAt: "2099-10-10T10:00:00.000Z",
};

const confirmedScan = {
  id: "scan-2",
  reference: "SCAN-002",
  status: SCAN_BOOKING_STATUS.CONFIRMED,

  labSlip: {
    patient: {
      name: "Confirmed Patient",
    },
  },

  clinic: {
    id: "clinic-1",
    name: "Cera Test Clinic",
  },

  confirmedStartAt: "2099-10-11T10:00:00.000Z",
};

const assignedScan = {
  id: "scan-3",
  reference: "SCAN-003",
  status: SCAN_BOOKING_STATUS.ASSIGNED,

  labSlip: {
    patient: {
      name: "Assigned Patient",
    },
  },

  clinic: {
    id: "clinic-2",
    name: "Second Clinic",
  },

  confirmedStartAt: "2099-10-12T10:00:00.000Z",
};

const pastConfirmedScan = {
  id: "scan-past",
  reference: "SCAN-PAST",
  status: SCAN_BOOKING_STATUS.CONFIRMED,

  labSlip: {
    patient: {
      name: "Past Patient",
    },
  },

  clinic: {
    id: "clinic-1",
    name: "Cera Test Clinic",
  },

  confirmedStartAt: "2000-01-01T10:00:00.000Z",
};

const clarification = {
  id: "correction-1",
  status: CORRECTION_STATUS.AWAITING_CLARIFICATION,
  description: "Please confirm the required adjustment.",

  labSlip: {
    reference: "CDL-2026-000002",

    patient: {
      name: "Correction Patient",
    },
  },
};

function createTestStore(user) {
  return configureStore({
    reducer: {
      auth: (
        state = {
          user,
          status: "succeeded",
          restoreStatus: "succeeded",
        },
      ) => state,
    },
  });
}

function renderPortal(user = doctor) {
  return render(
    <Provider store={createTestStore(user)}>
      <MemoryRouter>
        <PortalHomePage />
      </MemoryRouter>
    </Provider>,
  );
}

function pagination(total) {
  return {
    page: 1,
    limit: 5,
    total,
    pages: total > 0 ? 1 : 0,
  };
}

function mockDoctorDashboardData({
  labSlips = [recentLabSlip],
  awaitingConfirmation = [scanAwaitingConfirmation],
  confirmed = [confirmedScan, pastConfirmedScan],
  assigned = [assignedScan],
  corrections = [clarification],
} = {}) {
  getLabSlips.mockResolvedValue({
    data: {
      labSlips,

      pagination: pagination(labSlips.length),
    },
  });

  getScanBookings.mockImplementation(({ status }) => {
    if (status === SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION) {
      return Promise.resolve({
        data: {
          scanBookings: awaitingConfirmation,

          pagination: pagination(awaitingConfirmation.length),
        },
      });
    }

    if (status === SCAN_BOOKING_STATUS.CONFIRMED) {
      return Promise.resolve({
        data: {
          scanBookings: confirmed,

          pagination: pagination(confirmed.length),
        },
      });
    }

    if (status === SCAN_BOOKING_STATUS.ASSIGNED) {
      return Promise.resolve({
        data: {
          scanBookings: assigned,

          pagination: pagination(assigned.length),
        },
      });
    }

    return Promise.resolve({
      data: {
        scanBookings: [],

        pagination: pagination(0),
      },
    });
  });

  getCorrections.mockResolvedValue({
    data: {
      corrections,

      pagination: pagination(corrections.length),
    },
  });
}

describe("PortalHomePage Doctor dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDoctorDashboardData();
  });

  it("shows the Doctor dashboard and its quick actions", async () => {
    renderPortal();

    expect(
      screen.getByRole("heading", {
        name: "Welcome, Dr Example",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "+ New Lab Slip",
      }),
    ).toHaveAttribute("href", "/portal/lab-slips/new");

    expect(
      screen.getByRole("link", {
        name: "My Slips",
      }),
    ).toHaveAttribute("href", "/portal/lab-slips");

    expect(
      screen.getByRole("link", {
        name: "Scans",
      }),
    ).toHaveAttribute("href", "/portal/scans");

    expect(
      screen.getByRole("link", {
        name: "Corrections",
      }),
    ).toHaveAttribute("href", "/portal/corrections");

    await waitFor(() => {
      expect(getLabSlips).toHaveBeenCalledWith({
        page: 1,
        limit: 5,
      });
    });
  });

  it("shows scan confirmations and correction clarifications that need attention", async () => {
    renderPortal();

    expect(await screen.findByText("Confirmation Patient")).toBeInTheDocument();

    expect(screen.getByText("Scan confirmation")).toBeInTheDocument();

    expect(screen.getByText("Correction Patient")).toBeInTheDocument();

    expect(screen.getByText("Clarification requested")).toBeInTheDocument();

    expect(
      screen.getByText("Please confirm the required adjustment."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /SCAN-001/i,
      }),
    ).toHaveAttribute("href", "/portal/scans/scan-1");

    expect(
      screen.getByRole("link", {
        name: /CDL-2026-000002/i,
      }),
    ).toHaveAttribute("href", "/portal/corrections/correction-1");

    expect(getScanBookings).toHaveBeenCalledWith({
      status: SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
      page: 1,
      limit: 5,
    });

    expect(getCorrections).toHaveBeenCalledWith({
      status: CORRECTION_STATUS.AWAITING_CLARIFICATION,
      page: 1,
      limit: 5,
    });
  });

  it("shows only future confirmed and assigned scans in Upcoming scans", async () => {
    renderPortal();

    expect(await screen.findByText("Confirmed Patient")).toBeInTheDocument();

    expect(screen.getByText("Assigned Patient")).toBeInTheDocument();

    expect(screen.getByText("Scanner assigned")).toBeInTheDocument();

    expect(screen.queryByText("Past Patient")).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /SCAN-002/i,
      }),
    ).toHaveAttribute("href", "/portal/scans/scan-2");

    expect(
      screen.getByRole("link", {
        name: /SCAN-003/i,
      }),
    ).toHaveAttribute("href", "/portal/scans/scan-3");
  });

  it("shows recent Lab Slips", async () => {
    renderPortal();

    const labSlipLink = await screen.findByRole("link", {
      name: /CDL-2026-000001/i,
    });

    expect(within(labSlipLink).getByText("Recent Patient")).toBeInTheDocument();

    expect(
      within(labSlipLink).getByText("Cera Test Clinic"),
    ).toBeInTheDocument();

    expect(within(labSlipLink).getByText("Urgent")).toBeInTheDocument();

    expect(labSlipLink).toHaveAttribute("href", "/portal/lab-slips/slip-1");
  });

  it("shows useful empty states when the Doctor has no dashboard activity", async () => {
    mockDoctorDashboardData({
      labSlips: [],
      awaitingConfirmation: [],
      confirmed: [],
      assigned: [],
      corrections: [],
    });

    renderPortal();

    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();

    expect(
      screen.getByText("No upcoming scans scheduled."),
    ).toBeInTheDocument();

    expect(screen.getByText("No Lab Slips yet")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Create a Lab Slip when you're ready to send a case to Cera.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a dashboard error when dashboard data cannot be loaded", async () => {
    getLabSlips.mockRejectedValue(new Error("Dashboard request failed."));

    renderPortal();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dashboard request failed.",
    );
  });

  it("keeps the existing generic portal for non-Doctor roles", () => {
    const ceraStaff = {
      id: "staff-1",
      name: "Cera Staff",
      role: USER_ROLES.CERA_STAFF,
    };

    renderPortal(ceraStaff);

    expect(
      screen.getByRole("heading", {
        name: "Welcome, Cera Staff",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Production",
      }),
    ).toHaveAttribute("href", "/portal/production");

    expect(screen.queryByText("Doctor dashboard")).not.toBeInTheDocument();

    expect(getLabSlips).not.toHaveBeenCalled();

    expect(getScanBookings).not.toHaveBeenCalled();

    expect(getCorrections).not.toHaveBeenCalled();
  });
});
