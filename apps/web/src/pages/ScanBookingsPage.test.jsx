import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LAB_SLIP_URGENCY,
  SCAN_BOOKING_STATUS,
  USER_ROLES,
} from "@cera/shared";

import { getScanBookings } from "../api/scanBookings";

import { SCAN_BOOKING_STATUS_LABELS } from "../constants/scanBookingDisplay";

import { ScanBookingsPage } from "./ScanBookingsPage";

const mocked = vi.hoisted(() => ({
  user: null,
}));

vi.mock("react-redux", () => ({
  useSelector() {
    return mocked.user;
  },
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

vi.mock("../api/scanBookings", () => ({
  getScanBookings: vi.fn(),
}));

function pagination({ page = 1, pages = 1, total = 1 } = {}) {
  return {
    page,
    pages,
    total,
    limit: 20,
  };
}

function bookingWith(patch = {}) {
  return {
    id: "scan-1",

    reference: "SCAN-2026-000001",

    status: SCAN_BOOKING_STATUS.ASSIGNED,

    urgency: LAB_SLIP_URGENCY.STANDARD,

    labSlip: {
      id: "slip-1",

      reference: "CDL-2026-000001",

      patient: {
        name: "Test Patient",
        reference: "PAT-001",
      },
    },

    clinic: {
      id: "clinic-1",
      name: "Test Clinic",
    },

    doctor: null,

    assignedScanningStaff: {
      id: "scanner-1",
      name: "Scanner One",
    },

    requestedStartAt: "2099-10-10T04:00:00.000Z",

    proposedStartAt: null,

    confirmedStartAt: "2099-10-10T05:00:00.000Z",

    completedAt: null,

    reschedule: null,

    ...patch,
  };
}

function renderPage(user) {
  mocked.user = user;

  return render(
    <MemoryRouter>
      <ScanBookingsPage />
    </MemoryRouter>,
  );
}

describe("ScanBookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [bookingWith()],
        pagination: pagination(),
      },
    });
  });

  it("shows the mobile My Visits experience for Scanning Staff", async () => {
    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    expect(
      screen.getByRole("heading", {
        name: "My Visits",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Today's visits",
      }),
    ).toHaveAttribute("href", "/portal");

    expect(await screen.findByText("Test Patient")).toBeInTheDocument();

    expect(screen.getByText("Test Clinic")).toBeInTheDocument();

    expect(
      screen.getByText(new Date("2099-10-10T05:00:00.000Z").toLocaleString()),
    ).toBeInTheDocument();

    expect(screen.queryByText("Dr Example")).not.toBeInTheDocument();
  });

  it("shows only scanner-relevant status filters", async () => {
    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    await screen.findByText("Test Patient");

    expect(
      screen.getByRole("option", {
        name: "All visits",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.ASSIGNED],
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.COMPLETED],
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.CANCELLED],
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.PENDING_REVIEW],
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[
          SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION
        ],
      }),
    ).not.toBeInTheDocument();
  });

  it("requests a scanner status filter when it changes", async () => {
    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    await waitFor(() => {
      expect(getScanBookings).toHaveBeenCalledWith({
        status: "",
        page: 1,
      });
    });

    fireEvent.change(screen.getByLabelText("Visit status"), {
      target: {
        value: SCAN_BOOKING_STATUS.COMPLETED,
      },
    });

    await waitFor(() => {
      expect(getScanBookings).toHaveBeenCalledWith({
        status: SCAN_BOOKING_STATUS.COMPLETED,
        page: 1,
      });
    });
  });

  it("shows urgency and a read-only schedule-change notice", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [
          bookingWith({
            urgency: LAB_SLIP_URGENCY.URGENT,

            reschedule: {
              status: "REQUESTED",
              requestedStartAt: "2099-10-11T05:00:00.000Z",
              proposedStartAt: null,
              reason: "Patient requested another time",
              requestedAt: "2099-10-09T05:00:00.000Z",
            },
          }),
        ],

        pagination: pagination(),
      },
    });

    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    expect(await screen.findByText("Urgent")).toBeInTheDocument();

    expect(screen.getByText("Schedule change pending")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Continue to use the confirmed visit time until the schedule change is finalized.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /reschedule/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows a scanner-specific empty state", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [],
        pagination: pagination({
          total: 0,
        }),
      },
    });

    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    expect(await screen.findByText("No visits found")).toBeInTheDocument();

    expect(
      screen.getByText("No scanning visits have been assigned to you."),
    ).toBeInTheDocument();
  });

  it("shows a filtered scanner empty state", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [],
        pagination: pagination({
          total: 0,
        }),
      },
    });

    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    await screen.findByText("No visits found");

    fireEvent.change(screen.getByLabelText("Visit status"), {
      target: {
        value: SCAN_BOOKING_STATUS.COMPLETED,
      },
    });

    expect(
      await screen.findByText("There are no assigned visits with this status."),
    ).toBeInTheDocument();
  });

  it("shows a retryable scanner failure state", async () => {
    getScanBookings.mockRejectedValueOnce(new Error("Visit request failed."));

    getScanBookings.mockResolvedValueOnce({
      data: {
        scanBookings: [bookingWith()],
        pagination: pagination(),
      },
    });

    renderPage({
      id: "scanner-1",
      name: "Scanner One",
      role: USER_ROLES.SCANNING_STAFF,
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Visit request failed.",
    );

    expect(screen.queryByText("No visits found")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(await screen.findByText("Test Patient")).toBeInTheDocument();

    expect(getScanBookings).toHaveBeenCalledTimes(2);
  });

  it("keeps the existing full status workflow for Cera Staff", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [
          bookingWith({
            status: SCAN_BOOKING_STATUS.PENDING_REVIEW,

            confirmedStartAt: null,

            doctor: {
              id: "doctor-1",
              name: "Dr Example",
            },
          }),
        ],

        pagination: pagination(),
      },
    });

    renderPage({
      id: "staff-1",
      name: "Cera Staff",
      role: USER_ROLES.CERA_STAFF,
    });

    expect(
      screen.getByRole("heading", {
        name: "Scan Bookings",
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Dr Example")).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.PENDING_REVIEW],
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: SCAN_BOOKING_STATUS_LABELS[
          SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION
        ],
      }),
    ).toBeInTheDocument();
  });
});
