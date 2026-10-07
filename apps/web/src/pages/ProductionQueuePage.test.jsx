import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { LAB_SLIP_URGENCY, PRODUCTION_STATUS } from "@cera/shared";

import { getProductions } from "../api/productions";

import { ProductionQueuePage } from "./ProductionQueuePage";

vi.mock("../api/productions", () => ({
  getProductions: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

const submittedProduction = {
  id: "production-1",

  status: PRODUCTION_STATUS.SUBMITTED,

  labSlip: {
    id: "slip-1",

    reference: "CDL-2026-000001",

    patient: {
      name: "Patient One",
      reference: "PAT-001",
    },

    urgency: LAB_SLIP_URGENCY.URGENT,

    scanRequired: true,

    createdAt: "2026-10-07T08:00:00.000Z",
  },

  startedAt: null,

  completedAt: null,

  createdAt: "2026-10-07T08:00:00.000Z",

  updatedAt: "2026-10-07T08:00:00.000Z",
};

const inProductionProduction = {
  id: "production-2",

  status: PRODUCTION_STATUS.IN_PRODUCTION,

  labSlip: {
    id: "slip-2",

    reference: "CDL-2026-000002",

    patient: {
      name: "Patient Two",
      reference: null,
    },

    urgency: LAB_SLIP_URGENCY.STANDARD,

    scanRequired: false,

    createdAt: "2026-10-07T09:00:00.000Z",
  },

  startedAt: "2026-10-07T09:30:00.000Z",

  completedAt: null,

  createdAt: "2026-10-07T09:00:00.000Z",

  updatedAt: "2026-10-07T09:30:00.000Z",
};

const completedProduction = {
  id: "production-3",

  status: PRODUCTION_STATUS.COMPLETED,

  labSlip: {
    id: "slip-3",

    reference: "CDL-2026-000003",

    patient: {
      name: "Patient Three",
      reference: "PAT-003",
    },

    urgency: LAB_SLIP_URGENCY.STANDARD,

    scanRequired: false,

    createdAt: "2026-10-06T08:00:00.000Z",
  },

  startedAt: "2026-10-06T09:00:00.000Z",

  completedAt: "2026-10-07T10:00:00.000Z",

  createdAt: "2026-10-06T08:00:00.000Z",

  updatedAt: "2026-10-07T10:00:00.000Z",
};

function productionResponse({
  productions = [submittedProduction, inProductionProduction],
  page = 1,
  pages = 1,
  total = productions.length,
} = {}) {
  return {
    data: {
      productions,

      pagination: {
        page,
        limit: 20,
        total,
        pages,
      },
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProductionQueuePage />
    </MemoryRouter>,
  );
}

describe("ProductionQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProductions.mockResolvedValue(productionResponse());
  });

  it("shows the loading state while the production queue is loading", () => {
    getProductions.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading production queue...")).toBeInTheDocument();
  });

  it("loads and displays active production cases", async () => {
    renderPage();

    expect(await screen.findByText("CDL-2026-000001")).toBeInTheDocument();

    expect(screen.getByText("CDL-2026-000002")).toBeInTheDocument();

    expect(screen.getByText("Patient One")).toBeInTheDocument();

    expect(screen.getByText("Patient Two")).toBeInTheDocument();

    expect(screen.getByText("Patient ref: PAT-001")).toBeInTheDocument();

    expect(screen.getByText("Urgent")).toBeInTheDocument();

    expect(screen.getByText("Scan required")).toBeInTheDocument();

    expect(screen.getAllByText("Submitted").length).toBeGreaterThan(0);

    expect(screen.getAllByText("In Production").length).toBeGreaterThan(0);

    expect(getProductions).toHaveBeenCalledWith({
      status: "",
      page: 1,
    });
  });

  it("shows an empty state when no production cases match", async () => {
    getProductions.mockResolvedValue(
      productionResponse({
        productions: [],
        total: 0,
      }),
    );

    renderPage();

    expect(
      await screen.findByText("No production cases found"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "There are no cases matching the selected production status.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an API error", async () => {
    getProductions.mockRejectedValue(
      new Error("Unable to reach production service."),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach production service.",
    );
  });

  it("filters production cases by status", async () => {
    getProductions.mockResolvedValue(productionResponse());

    renderPage();

    await screen.findByText("CDL-2026-000001");

    fireEvent.change(screen.getByLabelText("Status"), {
      target: {
        value: PRODUCTION_STATUS.COMPLETED,
      },
    });

    await waitFor(() => {
      expect(getProductions).toHaveBeenLastCalledWith({
        status: PRODUCTION_STATUS.COMPLETED,
        page: 1,
      });
    });
  });

  it("supports explicitly requesting all production statuses", async () => {
    getProductions.mockResolvedValue(
      productionResponse({
        productions: [
          submittedProduction,
          inProductionProduction,
          completedProduction,
        ],
        total: 3,
      }),
    );

    renderPage();

    await screen.findByText("CDL-2026-000001");

    fireEvent.change(screen.getByLabelText("Status"), {
      target: {
        value: "ALL",
      },
    });

    await waitFor(() => {
      expect(getProductions).toHaveBeenLastCalledWith({
        status: "ALL",
        page: 1,
      });
    });
  });

  it("displays completed production cases when returned", async () => {
    getProductions.mockResolvedValue(
      productionResponse({
        productions: [completedProduction],
        total: 1,
      }),
    );

    renderPage();

    expect(await screen.findByText("CDL-2026-000003")).toBeInTheDocument();

    expect(screen.getByText("Patient Three")).toBeInTheDocument();

    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  it("moves between production queue pages", async () => {
    getProductions.mockImplementation(({ page }) => {
      if (page === 2) {
        return Promise.resolve(
          productionResponse({
            productions: [inProductionProduction],
            page: 2,
            pages: 2,
            total: 21,
          }),
        );
      }

      return Promise.resolve(
        productionResponse({
          productions: [submittedProduction],
          page: 1,
          pages: 2,
          total: 21,
        }),
      );
    });

    renderPage();

    await screen.findByText("CDL-2026-000001");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Next",
      }),
    );

    await waitFor(() => {
      expect(getProductions).toHaveBeenLastCalledWith({
        status: "",
        page: 2,
      });
    });

    expect(await screen.findByText("CDL-2026-000002")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Previous",
      }),
    );

    await waitFor(() => {
      expect(getProductions).toHaveBeenLastCalledWith({
        status: "",
        page: 1,
      });
    });
  });
});
