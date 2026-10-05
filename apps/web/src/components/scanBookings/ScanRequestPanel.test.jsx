import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SCAN_BOOKING_STATUS } from "@cera/shared";

import { ScanRequestPanel } from "./ScanRequestPanel";

import { createScanBooking, getScanBookings } from "../../api/scanBookings";

vi.mock("../../api/scanBookings", () => ({
  createScanBooking: vi.fn(),
  getScanBookings: vi.fn(),
}));

const labSlip = {
  id: "slip-1",
  scanRequired: false,
};

function renderPanel(slip = labSlip) {
  return render(
    <MemoryRouter>
      <ScanRequestPanel labSlip={slip} />
    </MemoryRouter>,
  );
}

describe("ScanRequestPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a scan request even when scanning was not selected during Lab Slip submission", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [],
      },
    });

    createScanBooking.mockResolvedValue({
      data: {
        scanBooking: {
          id: "scan-1",
          reference: "SCAN-2026-000001",
          status: SCAN_BOOKING_STATUS.PENDING_REVIEW,
        },
      },
    });

    renderPanel();

    expect(
      await screen.findByRole("heading", {
        name: "Request Cera scanning",
      }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText("Preferred date & time");

    const futureValue = "2099-10-10T10:30";

    fireEvent.change(input, {
      target: {
        value: futureValue,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Request Scan",
      }),
    );

    await waitFor(() => {
      expect(createScanBooking).toHaveBeenCalledTimes(1);
    });

    expect(createScanBooking).toHaveBeenCalledWith({
      labSlipId: "slip-1",

      requestedStartAt: new Date(futureValue).toISOString(),
    });

    expect(await screen.findByText("SCAN-2026-000001")).toBeInTheDocument();
  });

  it("shows an existing active booking instead of another request form", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [
          {
            id: "scan-1",

            reference: "SCAN-2026-000001",

            status: SCAN_BOOKING_STATUS.CONFIRMED,
          },
        ],
      },
    });

    renderPanel({
      ...labSlip,
      scanRequired: true,
    });

    expect(await screen.findByText("SCAN-2026-000001")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Request Scan",
      }),
    ).not.toBeInTheDocument();
  });

  it("allows another request when the previous booking was cancelled", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [
          {
            id: "scan-old",

            reference: "SCAN-2026-000001",

            status: SCAN_BOOKING_STATUS.CANCELLED,
          },
        ],
      },
    });

    renderPanel();

    expect(
      await screen.findByRole("button", {
        name: "Request Scan",
      }),
    ).toBeInTheDocument();
  });

  it("allows another request when the previous booking was rejected", async () => {
    getScanBookings.mockResolvedValue({
      data: {
        scanBookings: [
          {
            id: "scan-old",

            reference: "SCAN-2026-000001",

            status: SCAN_BOOKING_STATUS.REJECTED,
          },
        ],
      },
    });

    renderPanel();

    expect(
      await screen.findByRole("button", {
        name: "Request Scan",
      }),
    ).toBeInTheDocument();
  });
});
