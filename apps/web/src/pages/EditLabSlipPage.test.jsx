import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { LAB_SLIP_STATUS, LAB_SLIP_URGENCY } from "@cera/shared";

import { EditLabSlipPage } from "./EditLabSlipPage";

import { getCatalogProducts } from "../api/catalog";

import { getLabSlip, updateLabSlip } from "../api/labSlips";

vi.mock("../api/catalog", () => ({
  getCatalogProducts: vi.fn(),
}));

vi.mock("../api/labSlips", () => ({
  getLabSlip: vi.fn(),

  updateLabSlip: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

const slip = {
  id: "slip-1",

  reference: "CDL-2026-000001",

  status: LAB_SLIP_STATUS.SUBMITTED,

  urgency: LAB_SLIP_URGENCY.STANDARD,

  source: "PORTAL",

  clinic: {
    id: "clinic-1",

    name: "Test Clinic",
  },

  doctor: {
    id: "doctor-1",

    name: "Dr Example",
  },

  patient: {
    name: "Old Patient",

    reference: "PAT-001",
  },

  items: [
    {
      productId: "product-1",

      productName: "Zirconia Crown",

      categoryId: "category-1",

      categoryName: "Fixed Prosthesis",

      teeth: ["UR1"],

      shade: "A2",

      ponticDesign: "Standard",

      designNotes: "Old product note",
    },
  ],

  notes: "Old general note",

  scanRequired: false,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/portal/lab-slips/slip-1/edit"]}>
      <Routes>
        <Route
          path="/portal/lab-slips/:labSlipId/edit"
          element={<EditLabSlipPage />}
        />

        <Route
          path="/portal/lab-slips/:labSlipId"
          element={<div>Lab Slip Detail</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditLabSlipPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getLabSlip.mockResolvedValue({
      data: {
        labSlip: slip,
      },
    });

    getCatalogProducts.mockResolvedValue({
      data: {
        products: [
          {
            id: "product-1",

            name: "Zirconia Crown",

            category: {
              id: "category-1",

              name: "Fixed Prosthesis",
            },
          },
        ],
      },
    });

    updateLabSlip.mockResolvedValue({
      data: {
        labSlip: slip,
      },
    });
  });

  it("loads editable Lab Slip values", async () => {
    renderPage();

    expect(await screen.findByDisplayValue("Old Patient")).toBeInTheDocument();

    expect(screen.getByDisplayValue("PAT-001")).toBeInTheDocument();

    expect(screen.getByDisplayValue("A2")).toBeInTheDocument();

    expect(screen.getByDisplayValue("Old general note")).toBeInTheDocument();

    expect(
      screen.getByText("Test Clinic", {
        exact: false,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dr Example", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it("updates editable fields without sending immutable Lab Slip identity fields", async () => {
    renderPage();

    const patientName = await screen.findByLabelText("Patient name");

    fireEvent.change(patientName, {
      target: {
        value: "Updated Patient",
      },
    });

    fireEvent.change(screen.getByLabelText("Priority"), {
      target: {
        value: LAB_SLIP_URGENCY.URGENT,
      },
    });

    fireEvent.change(screen.getByLabelText("Shade"), {
      target: {
        value: "B1",
      },
    });

    fireEvent.change(screen.getByLabelText("General notes"), {
      target: {
        value: "Updated note",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save changes",
      }),
    );

    await waitFor(() => {
      expect(updateLabSlip).toHaveBeenCalledTimes(1);
    });

    const [labSlipId, payload] = updateLabSlip.mock.calls[0];

    expect(labSlipId).toBe("slip-1");

    expect(payload.patient.name).toBe("Updated Patient");

    expect(payload.urgency).toBe(LAB_SLIP_URGENCY.URGENT);

    expect(payload.items[0].shade).toBe("B1");

    expect(payload.notes).toBe("Updated note");

    expect(payload).not.toHaveProperty("clinicId");

    expect(payload).not.toHaveProperty("doctorId");

    expect(payload).not.toHaveProperty("reference");

    expect(payload).not.toHaveProperty("source");

    expect(payload).not.toHaveProperty("scanRequired");
  });

  it("returns to the detail page after saving", async () => {
    renderPage();

    await screen.findByDisplayValue("Old Patient");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save changes",
      }),
    );

    expect(await screen.findByText("Lab Slip Detail")).toBeInTheDocument();
  });
});
