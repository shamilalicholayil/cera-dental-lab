import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SCAN_BOOKING_STATUS, USER_ROLES } from "@cera/shared";

import { ScanBookingDetailPage } from "./ScanBookingDetailPage";

import {
  acceptAlternateScanTime,
  completeScanBooking,
  confirmScanBooking,
  getScanBooking,
  getScanningStaff,
} from "../api/scanBookings";

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
  acceptAlternateScanTime: vi.fn(),

  assignScanBooking: vi.fn(),

  cancelScanBooking: vi.fn(),

  completeScanBooking: vi.fn(),

  confirmScanBooking: vi.fn(),

  getScanBooking: vi.fn(),

  getScanningStaff: vi.fn(),

  proposeAlternateScanTime: vi.fn(),

  rejectScanBooking: vi.fn(),
}));

function bookingWith(patch = {}) {
  return {
    id: "scan-1",

    reference: "SCAN-2026-000001",

    status: SCAN_BOOKING_STATUS.PENDING_REVIEW,

    urgency: "STANDARD",

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

    doctor: {
      id: "doctor-1",

      name: "Dr Example",
    },

    assignedScanningStaff: null,

    requestedStartAt: "2099-10-10T05:00:00.000Z",

    proposedStartAt: null,

    confirmedStartAt: null,

    ...patch,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/portal/scans/scan-1"]}>
      <Routes>
        <Route
          path="/portal/scans/:bookingId"
          element={<ScanBookingDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ScanBookingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getScanningStaff.mockResolvedValue({
      data: {
        scanningStaff: [],
      },
    });
  });

  it("allows Cera Staff to confirm the requested time", async () => {
    mocked.user = {
      id: "staff-1",

      role: USER_ROLES.CERA_STAFF,
    };

    const initial = bookingWith();

    const confirmed = bookingWith({
      status: SCAN_BOOKING_STATUS.CONFIRMED,

      confirmedStartAt: initial.requestedStartAt,
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: initial,
      },
    });

    confirmScanBooking.mockResolvedValue({
      data: {
        scanBooking: confirmed,
      },
    });

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Confirm requested time",
      }),
    );

    await waitFor(() => {
      expect(confirmScanBooking).toHaveBeenCalledWith("scan-1");
    });

    expect(
      await screen.findByRole("heading", {
        name: "Assign scanning staff",
      }),
    ).toBeInTheDocument();
  });

  it("allows a Doctor to accept Cera's proposed time", async () => {
    mocked.user = {
      id: "doctor-1",

      role: USER_ROLES.DOCTOR,
    };

    const waiting = bookingWith({
      status: SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,

      proposedStartAt: "2099-10-11T05:00:00.000Z",
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: waiting,
      },
    });

    acceptAlternateScanTime.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          proposedStartAt: waiting.proposedStartAt,

          confirmedStartAt: waiting.proposedStartAt,
        }),
      },
    });

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Accept proposed time",
      }),
    );

    await waitFor(() => {
      expect(acceptAlternateScanTime).toHaveBeenCalledWith("scan-1");
    });
  });

  it("allows assigned Scanning Staff to complete the visit", async () => {
    mocked.user = {
      id: "scanner-1",

      role: USER_ROLES.SCANNING_STAFF,
    };

    const assigned = bookingWith({
      status: SCAN_BOOKING_STATUS.ASSIGNED,

      confirmedStartAt: "2099-10-10T05:00:00.000Z",

      assignedScanningStaff: {
        id: "scanner-1",

        name: "Scanner One",
      },
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: assigned,
      },
    });

    completeScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          ...assigned,

          status: SCAN_BOOKING_STATUS.COMPLETED,

          completedAt: "2099-10-10T06:00:00.000Z",
        }),
      },
    });

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Mark scan completed",
      }),
    );

    await waitFor(() => {
      expect(completeScanBooking).toHaveBeenCalledWith("scan-1");
    });

    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });
});
