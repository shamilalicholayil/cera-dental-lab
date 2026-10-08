import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LAB_SLIP_URGENCY,
  SCAN_BOOKING_STATUS,
  SCAN_RESCHEDULE_STATUS,
  USER_ROLES,
} from "@cera/shared";

import {
  acceptAlternateScanTime,
  acceptScanReschedule,
  completeScanBooking,
  confirmScanBooking,
  confirmScanReschedule,
  getScanBooking,
  getScanningStaff,
  proposeScanReschedule,
  requestScanReschedule,
} from "../api/scanBookings";

import { ScanBookingDetailPage } from "./ScanBookingDetailPage";

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

  acceptScanReschedule: vi.fn(),

  assignScanBooking: vi.fn(),

  cancelScanBooking: vi.fn(),

  completeScanBooking: vi.fn(),

  confirmScanBooking: vi.fn(),

  confirmScanReschedule: vi.fn(),

  getScanBooking: vi.fn(),

  getScanningStaff: vi.fn(),

  proposeAlternateScanTime: vi.fn(),

  proposeScanReschedule: vi.fn(),

  rejectScanBooking: vi.fn(),

  requestScanReschedule: vi.fn(),
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

      address: {
        line1: "10 Main Road",
        line2: null,
        locality: "Town Centre",
        city: "Kozhikode",
        district: "Kozhikode",
        state: "Kerala",
        pincode: "673001",
        country: "India",
      },
    },

    doctor: {
      id: "doctor-1",

      name: "Dr Example",
    },

    assignedScanningStaff: null,

    requestedStartAt: "2099-10-10T05:00:00.000Z",

    proposedStartAt: null,

    confirmedStartAt: null,

    reschedule: null,

    rescheduleHistory: [],

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

  /*
   * Existing 4B tests
   */

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

  /*
   * Module 4C tests
   */

  it("allows a Doctor to request a reschedule", async () => {
    mocked.user = {
      id: "doctor-1",

      role: USER_ROLES.DOCTOR,
    };

    const confirmedStartAt = "2099-10-10T05:00:00.000Z";

    const initial = bookingWith({
      status: SCAN_BOOKING_STATUS.CONFIRMED,

      confirmedStartAt,
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: initial,
      },
    });

    const requestedLocalTime = "2099-10-12T10:30";

    const requestedStartAt = new Date(requestedLocalTime).toISOString();

    requestScanReschedule.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          confirmedStartAt,

          reschedule: {
            status: SCAN_RESCHEDULE_STATUS.REQUESTED,

            requestedStartAt,

            proposedStartAt: null,

            reason: "Patient unavailable",

            requestedAt: "2099-10-09T05:00:00.000Z",
          },
        }),
      },
    });

    renderPage();

    fireEvent.change(
      await screen.findByLabelText("Preferred new date & time"),
      {
        target: {
          value: requestedLocalTime,
        },
      },
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Why does this appointment need to be changed?",
      ),
      {
        target: {
          value: "Patient unavailable",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Request reschedule",
      }),
    );

    await waitFor(() => {
      expect(requestScanReschedule).toHaveBeenCalledWith(
        "scan-1",
        requestedStartAt,
        "Patient unavailable",
      );
    });

    expect(
      await screen.findByText("Current appointment remains confirmed"),
    ).toBeInTheDocument();

    expect(screen.getByText("Reschedule requested")).toBeInTheDocument();
  });

  it("keeps the current confirmed time visible while a reschedule is pending", async () => {
    mocked.user = {
      id: "doctor-1",

      role: USER_ROLES.DOCTOR,
    };

    const confirmedStartAt = "2099-10-10T05:00:00.000Z";

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          confirmedStartAt,

          reschedule: {
            status: SCAN_RESCHEDULE_STATUS.REQUESTED,

            requestedStartAt: "2099-10-12T05:00:00.000Z",

            proposedStartAt: null,

            reason: "Patient unavailable",

            requestedAt: "2099-10-09T05:00:00.000Z",
          },
        }),
      },
    });

    renderPage();

    expect(
      await screen.findByText("Current appointment remains confirmed"),
    ).toBeInTheDocument();

    const displayedConfirmedTime = new Date(confirmedStartAt).toLocaleString();

    await waitFor(() => {
      expect(
        screen.getAllByText(displayedConfirmedTime).length,
      ).toBeGreaterThanOrEqual(2);
    });
  });

  it("allows Cera Staff to confirm a requested reschedule", async () => {
    mocked.user = {
      id: "staff-1",

      role: USER_ROLES.CERA_STAFF,
    };

    const oldConfirmedStartAt = "2099-10-10T05:00:00.000Z";

    const requestedStartAt = "2099-10-12T05:00:00.000Z";

    const initial = bookingWith({
      status: SCAN_BOOKING_STATUS.CONFIRMED,

      confirmedStartAt: oldConfirmedStartAt,

      reschedule: {
        status: SCAN_RESCHEDULE_STATUS.REQUESTED,

        requestedStartAt,

        proposedStartAt: null,

        reason: "Patient unavailable",

        requestedAt: "2099-10-09T05:00:00.000Z",
      },
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: initial,
      },
    });

    confirmScanReschedule.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          confirmedStartAt: requestedStartAt,

          reschedule: null,

          rescheduleHistory: [
            {
              previousConfirmedStartAt: oldConfirmedStartAt,

              requestedStartAt,

              proposedStartAt: null,

              confirmedStartAt: requestedStartAt,

              reason: "Patient unavailable",

              confirmedAt: "2099-10-09T06:00:00.000Z",
            },
          ],
        }),
      },
    });

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Confirm requested time",
      }),
    );

    await waitFor(() => {
      expect(confirmScanReschedule).toHaveBeenCalledWith("scan-1");
    });

    expect(
      await screen.findByRole("heading", {
        name: "Reschedule history",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Reschedule in progress"),
    ).not.toBeInTheDocument();
  });

  it("allows Cera Staff to propose a different reschedule time", async () => {
    mocked.user = {
      id: "staff-1",

      role: USER_ROLES.CERA_STAFF,
    };

    const confirmedStartAt = "2099-10-10T05:00:00.000Z";

    const requestedStartAt = "2099-10-12T05:00:00.000Z";

    const initial = bookingWith({
      status: SCAN_BOOKING_STATUS.CONFIRMED,

      confirmedStartAt,

      reschedule: {
        status: SCAN_RESCHEDULE_STATUS.REQUESTED,

        requestedStartAt,

        proposedStartAt: null,

        reason: "Patient unavailable",

        requestedAt: "2099-10-09T05:00:00.000Z",
      },
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: initial,
      },
    });

    const proposedLocalTime = "2099-10-13T11:30";

    const proposedStartAt = new Date(proposedLocalTime).toISOString();

    proposeScanReschedule.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          confirmedStartAt,

          reschedule: {
            status: SCAN_RESCHEDULE_STATUS.AWAITING_CONFIRMATION,

            requestedStartAt,

            proposedStartAt,

            reason: "Patient unavailable",

            requestedAt: "2099-10-09T05:00:00.000Z",
          },
        }),
      },
    });

    renderPage();

    fireEvent.change(await screen.findByLabelText("Proposed date & time"), {
      target: {
        value: proposedLocalTime,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Propose new time",
      }),
    );

    await waitFor(() => {
      expect(proposeScanReschedule).toHaveBeenCalledWith(
        "scan-1",
        proposedStartAt,
        "",
      );
    });

    expect(
      await screen.findByText("Waiting for Doctor / Clinic confirmation"),
    ).toBeInTheDocument();
  });

  it("allows a Doctor to accept Cera's proposed reschedule", async () => {
    mocked.user = {
      id: "doctor-1",

      role: USER_ROLES.DOCTOR,
    };

    const previousConfirmedStartAt = "2099-10-10T05:00:00.000Z";

    const proposedStartAt = "2099-10-13T05:00:00.000Z";

    const initial = bookingWith({
      status: SCAN_BOOKING_STATUS.CONFIRMED,

      confirmedStartAt: previousConfirmedStartAt,

      reschedule: {
        status: SCAN_RESCHEDULE_STATUS.AWAITING_CONFIRMATION,

        requestedStartAt: "2099-10-12T05:00:00.000Z",

        proposedStartAt,

        reason: "Patient unavailable",

        requestedAt: "2099-10-09T05:00:00.000Z",
      },
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: initial,
      },
    });

    acceptScanReschedule.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          confirmedStartAt: proposedStartAt,

          reschedule: null,

          rescheduleHistory: [
            {
              previousConfirmedStartAt,

              requestedStartAt: "2099-10-12T05:00:00.000Z",

              proposedStartAt,

              confirmedStartAt: proposedStartAt,

              reason: "Patient unavailable",

              confirmedAt: "2099-10-09T06:00:00.000Z",
            },
          ],
        }),
      },
    });

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Accept new time",
      }),
    );

    await waitFor(() => {
      expect(acceptScanReschedule).toHaveBeenCalledWith("scan-1");
    });

    expect(
      await screen.findByRole("heading", {
        name: "Reschedule history",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Accept new time",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps assigned Scanning Staff visible when an assigned booking is rescheduled", async () => {
    mocked.user = {
      id: "staff-1",

      role: USER_ROLES.CERA_STAFF,
    };

    const oldConfirmedStartAt = "2099-10-10T05:00:00.000Z";

    const requestedStartAt = "2099-10-12T05:00:00.000Z";

    const assignedScanner = {
      id: "scanner-1",

      name: "Scanner One",
    };

    const initial = bookingWith({
      status: SCAN_BOOKING_STATUS.ASSIGNED,

      confirmedStartAt: oldConfirmedStartAt,

      assignedScanningStaff: assignedScanner,

      reschedule: {
        status: SCAN_RESCHEDULE_STATUS.REQUESTED,

        requestedStartAt,

        proposedStartAt: null,

        reason: "Patient requested another day",

        requestedAt: "2099-10-09T05:00:00.000Z",
      },
    });

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: initial,
      },
    });

    confirmScanReschedule.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.ASSIGNED,

          confirmedStartAt: requestedStartAt,

          assignedScanningStaff: assignedScanner,

          reschedule: null,

          rescheduleHistory: [
            {
              previousConfirmedStartAt: oldConfirmedStartAt,

              requestedStartAt,

              proposedStartAt: null,

              confirmedStartAt: requestedStartAt,

              reason: "Patient requested another day",

              confirmedAt: "2099-10-09T06:00:00.000Z",
            },
          ],
        }),
      },
    });

    renderPage();

    expect(await screen.findByText("Scanner One")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm requested time",
      }),
    );

    await waitFor(() => {
      expect(confirmScanReschedule).toHaveBeenCalledWith("scan-1");
    });

    expect(screen.getByText("Scanner One")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Mark scan completed",
      }),
    ).toBeInTheDocument();
  });

  it("hides scanning staff assignment while a reschedule is pending", async () => {
    mocked.user = {
      id: "staff-1",

      role: USER_ROLES.CERA_STAFF,
    };

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.CONFIRMED,

          confirmedStartAt: "2099-10-10T05:00:00.000Z",

          reschedule: {
            status: SCAN_RESCHEDULE_STATUS.REQUESTED,

            requestedStartAt: "2099-10-12T05:00:00.000Z",

            proposedStartAt: null,

            reason: "Patient unavailable",

            requestedAt: "2099-10-09T05:00:00.000Z",
          },
        }),
      },
    });

    renderPage();

    expect(await screen.findByText("Reschedule requested")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Assign scanning staff",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders completed reschedule history", async () => {
    mocked.user = {
      id: "doctor-1",

      role: USER_ROLES.DOCTOR,
    };

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.COMPLETED,

          confirmedStartAt: "2099-10-13T05:00:00.000Z",

          rescheduleHistory: [
            {
              previousConfirmedStartAt: "2099-10-10T05:00:00.000Z",

              requestedStartAt: "2099-10-12T05:00:00.000Z",

              proposedStartAt: "2099-10-13T05:00:00.000Z",

              confirmedStartAt: "2099-10-13T05:00:00.000Z",

              reason: "Patient unavailable",

              confirmedAt: "2099-10-09T06:00:00.000Z",
            },
          ],
        }),
      },
    });

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Reschedule history",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Previous time")).toBeInTheDocument();

    expect(screen.getByText("Confirmed new time")).toBeInTheDocument();

    expect(screen.getByText("Patient unavailable")).toBeInTheDocument();
  });

  it("does not show reschedule controls to Scanning Staff", async () => {
    mocked.user = {
      id: "scanner-1",

      role: USER_ROLES.SCANNING_STAFF,
    };

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.ASSIGNED,

          confirmedStartAt: "2099-10-10T05:00:00.000Z",

          assignedScanningStaff: {
            id: "scanner-1",

            name: "Scanner One",
          },

          reschedule: {
            status: SCAN_RESCHEDULE_STATUS.AWAITING_CONFIRMATION,

            requestedStartAt: "2099-10-12T05:00:00.000Z",

            proposedStartAt: "2099-10-13T05:00:00.000Z",

            reason: "Patient unavailable",

            requestedAt: "2099-10-09T05:00:00.000Z",
          },
        }),
      },
    });

    renderPage();

    expect(
      await screen.findByText("Current appointment remains confirmed"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Mark scan completed",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Request reschedule",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Accept new time",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Reschedule management",
      }),
    ).not.toBeInTheDocument();
  });

  it("prioritizes the confirmed visit information for Scanning Staff", async () => {
    mocked.user = {
      id: "scanner-1",
      role: USER_ROLES.SCANNING_STAFF,
    };

    const confirmedStartAt = "2099-10-10T05:00:00.000Z";

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.ASSIGNED,

          urgency: LAB_SLIP_URGENCY.URGENT,

          confirmedStartAt,

          doctor: null,

          assignedScanningStaff: {
            id: "scanner-1",
            name: "Scanner One",
          },
        }),
      },
    });

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Scan visit",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Confirmed visit time")).toBeInTheDocument();

    expect(
      screen.getByText(new Date(confirmedStartAt).toLocaleString()),
    ).toBeInTheDocument();

    expect(screen.getByText("Test Patient")).toBeInTheDocument();

    expect(screen.getByText("Test Clinic")).toBeInTheDocument();

    expect(
      screen.getByText(
        "10 Main Road, Town Centre, Kozhikode, Kozhikode, Kerala, 673001",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Urgent")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /My Visits/i,
      }),
    ).toHaveAttribute("href", "/portal/scans");

    expect(screen.queryByText("Dr Example")).not.toBeInTheDocument();

    expect(screen.queryByText("Requested")).not.toBeInTheDocument();

    expect(screen.queryByText("Proposed")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Mark scan completed",
      }),
    ).toBeInTheDocument();
  });

  it("shows scanner completion information after the visit is completed", async () => {
    mocked.user = {
      id: "scanner-1",
      role: USER_ROLES.SCANNING_STAFF,
    };

    const completedAt = "2099-10-10T06:00:00.000Z";

    getScanBooking.mockResolvedValue({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.COMPLETED,

          confirmedStartAt: "2099-10-10T05:00:00.000Z",

          completedAt,

          doctor: null,

          assignedScanningStaff: {
            id: "scanner-1",
            name: "Scanner One",
          },
        }),
      },
    });

    renderPage();

    expect(await screen.findByText("Scan completed")).toBeInTheDocument();

    expect(
      screen.getByText(
        `Completed at ${new Date(completedAt).toLocaleString()}`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Mark scan completed",
      }),
    ).not.toBeInTheDocument();
  });

  it("lets Scanning Staff retry when the visit cannot be loaded", async () => {
    mocked.user = {
      id: "scanner-1",
      role: USER_ROLES.SCANNING_STAFF,
    };

    getScanBooking.mockRejectedValueOnce(new Error("Visit request failed."));

    getScanBooking.mockResolvedValueOnce({
      data: {
        scanBooking: bookingWith({
          status: SCAN_BOOKING_STATUS.ASSIGNED,

          confirmedStartAt: "2099-10-10T05:00:00.000Z",

          doctor: null,

          assignedScanningStaff: {
            id: "scanner-1",
            name: "Scanner One",
          },
        }),
      },
    });

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Visit request failed.",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Scan visit",
      }),
    ).toBeInTheDocument();

    expect(getScanBooking).toHaveBeenCalledTimes(2);
  });
});
