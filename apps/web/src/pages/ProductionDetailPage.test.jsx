import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { LAB_SLIP_URGENCY, PRODUCTION_STATUS, USER_ROLES } from "@cera/shared";

import {
  completeProduction,
  getProduction,
  moveProductionBack,
  startProduction,
} from "../api/productions";

import { ProductionDetailPage } from "./ProductionDetailPage";

vi.mock("../api/productions", () => ({
  getProduction: vi.fn(),
  startProduction: vi.fn(),
  completeProduction: vi.fn(),
  moveProductionBack: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

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

const submittedProduction = {
  id: "production-1",

  status: PRODUCTION_STATUS.SUBMITTED,

  labSlip: {
    id: "slip-1",

    reference: "CDL-2026-000001",

    patient: {
      name: "Production Patient",
      reference: "PAT-001",
    },

    urgency: LAB_SLIP_URGENCY.URGENT,

    scanRequired: true,

    createdAt: "2026-10-07T08:00:00.000Z",
  },

  startedAt: null,

  completedAt: null,

  history: [],

  createdAt: "2026-10-07T08:00:00.000Z",

  updatedAt: "2026-10-07T08:00:00.000Z",
};

const inProductionProduction = {
  ...submittedProduction,

  status: PRODUCTION_STATUS.IN_PRODUCTION,

  startedAt: "2026-10-07T09:00:00.000Z",

  updatedAt: "2026-10-07T09:00:00.000Z",

  history: [
    {
      previousStatus: PRODUCTION_STATUS.SUBMITTED,

      newStatus: PRODUCTION_STATUS.IN_PRODUCTION,

      changedBy: {
        id: ceraStaff.id,
        name: ceraStaff.name,
      },

      note: "Fabrication started",

      changedAt: "2026-10-07T09:00:00.000Z",
    },
  ],
};

const completedProduction = {
  ...inProductionProduction,

  status: PRODUCTION_STATUS.COMPLETED,

  completedAt: "2026-10-07T11:00:00.000Z",

  updatedAt: "2026-10-07T11:00:00.000Z",

  history: [
    ...inProductionProduction.history,

    {
      previousStatus: PRODUCTION_STATUS.IN_PRODUCTION,

      newStatus: PRODUCTION_STATUS.COMPLETED,

      changedBy: {
        id: ceraStaff.id,
        name: ceraStaff.name,
      },

      note: "Final internal check completed",

      changedAt: "2026-10-07T11:00:00.000Z",
    },
  ],
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

function renderPage(user = ceraStaff) {
  return render(
    <Provider store={createTestStore(user)}>
      <MemoryRouter initialEntries={["/portal/production/production-1"]}>
        <Routes>
          <Route
            path="/portal/production/:productionId"
            element={<ProductionDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProductionDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProduction.mockResolvedValue({
      data: {
        production: submittedProduction,
      },
    });
  });

  it("loads and displays a production case", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "CDL-2026-000001",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Production Patient")).toBeInTheDocument();

    expect(screen.getByText("Patient reference")).toBeInTheDocument();

    expect(screen.getByText("PAT-001")).toBeInTheDocument();

    expect(screen.getByText("Urgent")).toBeInTheDocument();

    expect(screen.getByText("Scan required")).toBeInTheDocument();

    expect(
      screen.getByText(
        /production can start only after the related scan has been completed/i,
      ),
    ).toBeInTheDocument();

    expect(getProduction).toHaveBeenCalledWith("production-1");
  });

  it("allows Cera Staff to start production with an optional note", async () => {
    startProduction.mockResolvedValue({
      data: {
        production: inProductionProduction,
      },
    });

    renderPage();

    await screen.findByRole("button", {
      name: "Start Production",
    });

    fireEvent.change(screen.getByPlaceholderText("Optional production note"), {
      target: {
        value: "Fabrication started",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Start Production",
      }),
    );

    await waitFor(() => {
      expect(startProduction).toHaveBeenCalledWith(
        "production-1",
        "Fabrication started",
      );
    });

    expect(
      await screen.findByRole("button", {
        name: "Mark Production Completed",
      }),
    ).toBeInTheDocument();
  });

  it("allows Cera Staff to complete production with an optional note", async () => {
    getProduction.mockResolvedValue({
      data: {
        production: inProductionProduction,
      },
    });

    completeProduction.mockResolvedValue({
      data: {
        production: completedProduction,
      },
    });

    renderPage();

    await screen.findByRole("button", {
      name: "Mark Production Completed",
    });

    fireEvent.change(screen.getByPlaceholderText("Optional completion note"), {
      target: {
        value: "Final internal check completed",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark Production Completed",
      }),
    );

    await waitFor(() => {
      expect(completeProduction).toHaveBeenCalledWith(
        "production-1",
        "Final internal check completed",
      );
    });

    expect(
      await screen.findByText("Final internal check completed"),
    ).toBeInTheDocument();
  });

  it("shows production history newest first", async () => {
    getProduction.mockResolvedValue({
      data: {
        production: completedProduction,
      },
    });

    renderPage();

    expect(await screen.findByText("Production history")).toBeInTheDocument();

    expect(screen.getByText("Fabrication started")).toBeInTheDocument();

    expect(
      screen.getByText("Final internal check completed"),
    ).toBeInTheDocument();

    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes("By Cera Staff"),
      ).length,
    ).toBeGreaterThan(0);
  });

  it("shows backward controls to Admin and requires a reason", async () => {
    getProduction.mockResolvedValue({
      data: {
        production: completedProduction,
      },
    });

    moveProductionBack.mockResolvedValue({
      data: {
        production: inProductionProduction,
      },
    });

    renderPage(admin);

    const moveBackButton = await screen.findByRole("button", {
      name: "Move Back to In Production",
    });

    expect(moveBackButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: {
        value: "Completion was recorded too early",
      },
    });

    expect(moveBackButton).not.toBeDisabled();

    fireEvent.click(moveBackButton);

    await waitFor(() => {
      expect(moveProductionBack).toHaveBeenCalledWith(
        "production-1",
        PRODUCTION_STATUS.IN_PRODUCTION,
        "Completion was recorded too early",
      );
    });
  });

  it("does not show backward controls to Cera Staff", async () => {
    getProduction.mockResolvedValue({
      data: {
        production: completedProduction,
      },
    });

    renderPage(ceraStaff);

    await screen.findByRole("heading", {
      name: "CDL-2026-000001",
    });

    expect(
      screen.queryByText("Admin status correction"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Move Back to In Production",
      }),
    ).not.toBeInTheDocument();
  });

  it("allows Admin to move in-production back to submitted", async () => {
    getProduction.mockResolvedValue({
      data: {
        production: inProductionProduction,
      },
    });

    moveProductionBack.mockResolvedValue({
      data: {
        production: submittedProduction,
      },
    });

    renderPage(admin);

    const button = await screen.findByRole("button", {
      name: "Move Back to Submitted",
    });

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: {
        value: "Production started accidentally",
      },
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(moveProductionBack).toHaveBeenCalledWith(
        "production-1",
        PRODUCTION_STATUS.SUBMITTED,
        "Production started accidentally",
      );
    });

    expect(
      await screen.findByRole("button", {
        name: "Start Production",
      }),
    ).toBeInTheDocument();
  });

  it("shows an action error without removing the production case", async () => {
    startProduction.mockRejectedValue(
      new Error("Complete the required scan before starting production."),
    );

    renderPage();

    await screen.findByRole("button", {
      name: "Start Production",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Start Production",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Complete the required scan before starting production.",
    );

    expect(
      screen.getByRole("heading", {
        name: "CDL-2026-000001",
      }),
    ).toBeInTheDocument();
  });
});
