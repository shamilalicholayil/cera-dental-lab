import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LAB_SLIP_STATUS,
  LAB_SLIP_URGENCY,
  PRODUCTION_STATUS,
  USER_ROLES,
} from "@cera/shared";

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

const doctor = {
  id: "doctor-1",

  name: "Dr Example",

  role: USER_ROLES.DOCTOR,
};

const ceraStaff = {
  id: "staff-1",

  name: "Cera Staff",

  role: USER_ROLES.CERA_STAFF,
};

const admin = {
  id: "admin-1",

  name: "Cera Admin",

  role: USER_ROLES.CERA_ADMIN,
};

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

  production: {
    status: PRODUCTION_STATUS.SUBMITTED,
  },
};

const inProductionSlip = {
  ...slip,

  production: {
    status: PRODUCTION_STATUS.IN_PRODUCTION,
  },
};

const completedSlip = {
  ...slip,

  production: {
    status: PRODUCTION_STATUS.COMPLETED,
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

function renderPage(user = doctor) {
  return render(
    <Provider store={createTestStore(user)}>
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
      </MemoryRouter>
    </Provider>,
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

  it("loads editable Lab Slip values while production is submitted", async () => {
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

    expect(
      screen.getByRole("button", {
        name: "Save changes",
      }),
    ).toBeInTheDocument();
  });

  it("updates editable fields without sending immutable or override fields during a normal edit", async () => {
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

    expect(payload).not.toHaveProperty("overrideReason");
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

  it("blocks Cera Staff from editing after production has started", async () => {
    getLabSlip.mockResolvedValue({
      data: {
        labSlip: inProductionSlip,
      },
    });

    renderPage(ceraStaff);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lab Slip editing is locked",
    );

    expect(
      screen.getByText(/production has already started/i),
    ).toBeInTheDocument();

    expect(screen.queryByLabelText("Patient name")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /save/i,
      }),
    ).not.toBeInTheDocument();

    expect(updateLabSlip).not.toHaveBeenCalled();
  });

  it("blocks Doctor editing when production is completed", async () => {
    getLabSlip.mockResolvedValue({
      data: {
        labSlip: completedSlip,
      },
    });

    renderPage(doctor);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lab Slip editing is locked",
    );

    expect(screen.queryByLabelText("Patient name")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /save/i,
      }),
    ).not.toBeInTheDocument();

    expect(updateLabSlip).not.toHaveBeenCalled();
  });

  it("shows Admin override controls after production has started", async () => {
    getLabSlip.mockResolvedValue({
      data: {
        labSlip: inProductionSlip,
      },
    });

    renderPage(admin);

    expect(
      await screen.findByText("Admin production-lock override"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Override reason")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Save Admin Override",
      }),
    ).toBeDisabled();

    expect(screen.getByLabelText("Patient name")).toBeInTheDocument();
  });

  it("allows Admin to save a locked Lab Slip with an override reason", async () => {
    getLabSlip.mockResolvedValue({
      data: {
        labSlip: inProductionSlip,
      },
    });

    updateLabSlip.mockResolvedValue({
      data: {
        labSlip: {
          ...inProductionSlip,

          notes: "Corrected instructions",
        },
      },
    });

    renderPage(admin);

    await screen.findByText("Admin production-lock override");

    fireEvent.change(screen.getByLabelText("General notes"), {
      target: {
        value: "Corrected instructions",
      },
    });

    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: {
        value: "Doctor confirmed the original instructions were incorrect",
      },
    });

    const saveButton = screen.getByRole("button", {
      name: "Save Admin Override",
    });

    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateLabSlip).toHaveBeenCalledTimes(1);
    });

    expect(updateLabSlip).toHaveBeenCalledWith(
      "slip-1",

      expect.objectContaining({
        notes: "Corrected instructions",

        overrideReason:
          "Doctor confirmed the original instructions were incorrect",
      }),
    );
  });

  it("shows an integrity error instead of an edit form when Production is unavailable", async () => {
    getLabSlip.mockResolvedValue({
      data: {
        labSlip: {
          ...slip,

          production: null,
        },
      },
    });

    renderPage(admin);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Production information is unavailable",
    );

    expect(screen.queryByLabelText("Patient name")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /save/i,
      }),
    ).not.toBeInTheDocument();

    expect(updateLabSlip).not.toHaveBeenCalled();
  });
});
