import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LAB_SLIP_SOURCE,
  LAB_SLIP_STATUS,
  LAB_SLIP_URGENCY,
  USER_ROLES,
} from "@cera/shared";

import { NewLabSlipPage } from "./NewLabSlipPage";

import { LabSlipsPage } from "./LabSlipsPage";

import { LabSlipDetailPage } from "./LabSlipDetailPage";

import { getAccessibleClinics, getClinicDoctors } from "../api/clinics";

import { getCatalogCategories, getCatalogProducts } from "../api/catalog";

import { createLabSlip, getLabSlip, getLabSlips } from "../api/labSlips";

vi.mock("../api/clinics", () => ({
  getAccessibleClinics: vi.fn(),

  getClinicDoctors: vi.fn(),
}));

vi.mock("../api/catalog", () => ({
  getCatalogCategories: vi.fn(),

  getCatalogProducts: vi.fn(),
}));

vi.mock("../api/labSlips", () => ({
  createLabSlip: vi.fn(),

  getLabSlips: vi.fn(),

  getLabSlip: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

const clinic = {
  id: "clinic-1",

  name: "Cera Test Clinic",

  type: "CLINIC",

  address: {
    city: "Kozhikode",
  },
};

const doctor = {
  id: "doctor-1",

  name: "Dr Example",

  phone: "+919876543210",

  email: "doctor@example.com",

  role: USER_ROLES.DOCTOR,

  status: "ACTIVE",
};

const category = {
  id: "category-1",

  name: "Fixed Prosthesis",

  status: "ACTIVE",
};

const product = {
  id: "product-1",

  name: "Zirconia Crown",

  status: "ACTIVE",

  category: {
    id: category.id,

    name: category.name,

    status: "ACTIVE",
  },
};

const labSlip = {
  id: "slip-1",

  reference: "CDL-2026-000001",

  source: LAB_SLIP_SOURCE.PORTAL,

  status: LAB_SLIP_STATUS.SUBMITTED,

  urgency: LAB_SLIP_URGENCY.STANDARD,

  clinic: {
    id: clinic.id,

    name: clinic.name,

    type: clinic.type,

    city: "Kozhikode",
  },

  doctor: {
    id: doctor.id,

    name: doctor.name,

    phone: doctor.phone,

    email: doctor.email,
  },

  patient: {
    name: "Test Patient",

    reference: "PAT-001",
  },

  items: [
    {
      id: "item-1",

      productId: product.id,

      productName: "Zirconia Crown",

      categoryId: category.id,

      categoryName: category.name,

      teeth: ["UR1", "UR2"],

      shade: "A2",

      ponticDesign: "Standard",

      designNotes: "Check occlusion",
    },
  ],

  notes: "General notes",

  scanRequired: true,

  createdAt: "2026-10-05T10:00:00.000Z",

  updatedAt: "2026-10-05T10:00:00.000Z",
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

function renderNewSlip(user) {
  return render(
    <Provider store={createTestStore(user)}>
      <MemoryRouter>
        <NewLabSlipPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("NewLabSlipPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAccessibleClinics.mockResolvedValue({
      data: {
        clinics: [clinic],
      },
    });

    getCatalogCategories.mockResolvedValue({
      data: {
        categories: [category],
      },
    });

    getCatalogProducts.mockResolvedValue({
      data: {
        products: [product],
      },
    });

    getClinicDoctors.mockResolvedValue({
      data: {
        doctors: [doctor],
      },
    });

    createLabSlip.mockResolvedValue({
      data: {
        labSlip,
      },
    });
  });

  it("lets a Doctor create a portal lab slip without choosing a Doctor", async () => {
    renderNewSlip(doctor);

    await screen.findByRole("option", {
      name: "Cera Test Clinic",
    });

    expect(screen.queryByLabelText("Doctor")).not.toBeInTheDocument();

    expect(screen.queryByLabelText("Request source")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Patient name"), {
      target: {
        value: "Test Patient",
      },
    });

    fireEvent.change(screen.getByLabelText("Patient reference optional"), {
      target: {
        value: "PAT-001",
      },
    });

    fireEvent.change(screen.getByLabelText("Product"), {
      target: {
        value: product.id,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tooth UR1",
      }),
    );

    fireEvent.change(screen.getByLabelText("Shade"), {
      target: {
        value: "A2",
      },
    });

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", {
        name: "Submit Lab Slip",
      }),
    );

    await waitFor(() => {
      expect(createLabSlip).toHaveBeenCalledTimes(1);
    });

    expect(createLabSlip).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: clinic.id,

        source: LAB_SLIP_SOURCE.PORTAL,

        urgency: LAB_SLIP_URGENCY.STANDARD,

        patient: {
          name: "Test Patient",

          reference: "PAT-001",
        },

        scanRequired: true,
      }),
    );

    const submitted = createLabSlip.mock.calls[0][0];

    expect(submitted).not.toHaveProperty("doctorId");

    expect(submitted.items[0]).toEqual(
      expect.objectContaining({
        productId: product.id,

        teeth: ["UR1"],

        shade: "A2",
      }),
    );
  });

  it("loads clinic Doctors for Cera Staff and submits the selected source", async () => {
    const ceraStaff = {
      id: "staff-1",

      name: "Cera Staff",

      role: USER_ROLES.CERA_STAFF,
    };

    renderNewSlip(ceraStaff);

    await screen.findByRole("option", {
      name: "Dr Example",
    });

    fireEvent.change(screen.getByLabelText("Request source"), {
      target: {
        value: LAB_SLIP_SOURCE.PHONE,
      },
    });

    fireEvent.change(screen.getByLabelText("Patient name"), {
      target: {
        value: "Phone Patient",
      },
    });

    fireEvent.change(screen.getByLabelText("Product"), {
      target: {
        value: product.id,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Submit Lab Slip",
      }),
    );

    await waitFor(() => {
      expect(createLabSlip).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId: clinic.id,

          doctorId: doctor.id,

          source: LAB_SLIP_SOURCE.PHONE,
        }),
      );
    });

    expect(getClinicDoctors).toHaveBeenCalledWith(clinic.id);
  });

  it("shows validation when patient name is missing", async () => {
    renderNewSlip(doctor);

    await screen.findByRole("option", {
      name: "Zirconia Crown",
    });

    fireEvent.change(screen.getByLabelText("Product"), {
      target: {
        value: product.id,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Submit Lab Slip",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Patient name is required.",
    );

    expect(createLabSlip).not.toHaveBeenCalled();
  });
});

describe("LabSlipsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getLabSlips.mockResolvedValue({
      data: {
        labSlips: [labSlip],

        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      },
    });
  });

  it("shows accessible lab slips", async () => {
    render(
      <MemoryRouter>
        <LabSlipsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("CDL-2026-000001")).toBeInTheDocument();

    expect(screen.getByText("Test Patient")).toBeInTheDocument();

    expect(
      screen.getByText(/Cera Test Clinic · Dr Example/i),
    ).toBeInTheDocument();

    expect(screen.getByText("Scan required")).toBeInTheDocument();

    expect(getLabSlips).toHaveBeenCalledWith({
      search: "",
      page: 1,
    });
  });

  it("searches by reference or patient", async () => {
    render(
      <MemoryRouter>
        <LabSlipsPage />
      </MemoryRouter>,
    );

    await screen.findByText("CDL-2026-000001");

    fireEvent.change(
      screen.getByPlaceholderText("Search reference or patient"),
      {
        target: {
          value: "PAT-001",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search",
      }),
    );

    await waitFor(() => {
      expect(getLabSlips).toHaveBeenLastCalledWith({
        search: "PAT-001",

        page: 1,
      });
    });
  });
});

describe("LabSlipDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getLabSlip.mockResolvedValue({
      data: {
        labSlip,
      },
    });
  });

  it("displays the stored lab slip snapshot", async () => {
    render(
      <MemoryRouter initialEntries={["/portal/lab-slips/slip-1"]}>
        <Routes>
          <Route
            path="/portal/lab-slips/:labSlipId"
            element={<LabSlipDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "CDL-2026-000001",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Test Patient")).toBeInTheDocument();

    expect(screen.getByText("Zirconia Crown")).toBeInTheDocument();

    expect(screen.getByText("UR1, UR2")).toBeInTheDocument();

    expect(screen.getByText("A2")).toBeInTheDocument();

    expect(screen.getByText("Check occlusion")).toBeInTheDocument();

    expect(screen.getByText("General notes")).toBeInTheDocument();

    expect(getLabSlip).toHaveBeenCalledWith("slip-1");
  });
});
