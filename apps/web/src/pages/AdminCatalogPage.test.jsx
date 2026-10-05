import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { CATALOG_STATUS, USER_ROLES, USER_STATUS } from "@cera/shared";

import { renderWithStore } from "../test/renderWithStore";

import { AdminCatalogPage } from "./AdminCatalogPage";

import {
  activateCategory,
  createCategory,
  createProduct,
  disableProduct,
  getAdminCategories,
  getAdminProducts,
  updateProduct,
} from "../api/catalog";

vi.mock("../api/catalog", () => ({
  getAdminCategories: vi.fn(),

  createCategory: vi.fn(),

  updateCategory: vi.fn(),

  disableCategory: vi.fn(),

  activateCategory: vi.fn(),

  getAdminProducts: vi.fn(),

  createProduct: vi.fn(),

  updateProduct: vi.fn(),

  disableProduct: vi.fn(),

  activateProduct: vi.fn(),

  getCatalogCategories: vi.fn(),

  getCatalogProducts: vi.fn(),
}));

vi.mock("../components/portal/PortalHeader", () => ({
  PortalHeader() {
    return <header>Cera Portal</header>;
  },
}));

const adminState = {
  auth: {
    user: {
      id: "admin-1",
      name: "Cera Admin",
      phone: "+919876543210",
      email: null,
      role: USER_ROLES.CERA_ADMIN,
      status: USER_STATUS.ACTIVE,
    },

    status: "succeeded",

    restoreStatus: "succeeded",

    error: null,

    logoutStatus: "idle",

    logoutError: null,
  },
};

const category = {
  id: "category-1",

  name: "Fixed Prosthesis",

  slug: "fixed-prosthesis",

  description: "Fixed prosthetic products",

  status: CATALOG_STATUS.ACTIVE,

  sortOrder: 1,
};

const product = {
  id: "product-1",

  name: "Zirconia Crown",

  slug: "zirconia-crown",

  shortDescription: "Zirconia restoration",

  status: CATALOG_STATUS.ACTIVE,

  publicVisible: true,

  sortOrder: 1,

  category: {
    id: category.id,

    name: category.name,

    slug: category.slug,

    status: category.status,
  },
};

const categoryResponse = {
  data: {
    categories: [category],

    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    },
  },
};

const productResponse = {
  data: {
    products: [product],

    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    },
  },
};

describe("AdminCatalogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAdminCategories.mockResolvedValue(categoryResponse);

    getAdminProducts.mockResolvedValue(productResponse);
  });

  it("loads and displays products", async () => {
    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    const productName = await screen.findByText("Zirconia Crown");

    const productCard = productName.closest("article");

    expect(
      within(productCard).getByText("Fixed Prosthesis"),
    ).toBeInTheDocument();

    expect(within(productCard).getByText("Active")).toBeInTheDocument();

    expect(within(productCard).getByText("Public")).toBeInTheDocument();

    expect(getAdminProducts).toHaveBeenCalledTimes(1);

    expect(getAdminCategories).toHaveBeenCalledTimes(1);
  });

  it("loads categories when Categories tab is selected", async () => {
    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Zirconia Crown");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Categories",
      }),
    );

    const categoryName = await screen.findByText("Fixed Prosthesis");

    const categoryCard = categoryName.closest("article");

    expect(within(categoryCard).getByText("Active")).toBeInTheDocument();

    expect(within(categoryCard).getByText("Sort order: 1")).toBeInTheDocument();

    expect(getAdminCategories).toHaveBeenCalled();
  });

  it("creates a category", async () => {
    createCategory.mockResolvedValue({
      data: {
        category,
      },
    });

    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Zirconia Crown");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Categories",
      }),
    );

    await screen.findByText("Fixed Prosthesis");

    fireEvent.click(
      screen.getByRole("button", {
        name: /add category/i,
      }),
    );

    const dialog = screen.getByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Category name"), {
      target: {
        value: "Removable Appliances",
      },
    });

    fireEvent.change(within(dialog).getByLabelText("Description"), {
      target: {
        value: "Removable dental appliances",
      },
    });

    fireEvent.change(within(dialog).getByLabelText("Sort order"), {
      target: {
        value: "2",
      },
    });

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Create category",
      }),
    );

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: "Removable Appliances",

        description: "Removable dental appliances",

        sortOrder: 2,
      });
    });
  });

  it("creates a product", async () => {
    createProduct.mockResolvedValue({
      data: {
        product,
      },
    });

    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Zirconia Crown");

    fireEvent.click(
      screen.getByRole("button", {
        name: /add product/i,
      }),
    );

    const dialog = screen.getByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Category"), {
      target: {
        value: "category-1",
      },
    });

    fireEvent.change(within(dialog).getByLabelText("Product name"), {
      target: {
        value: "DMLS Crown",
      },
    });

    fireEvent.change(within(dialog).getByLabelText("Short description"), {
      target: {
        value: "Metal crown",
      },
    });

    fireEvent.change(within(dialog).getByLabelText("Sort order"), {
      target: {
        value: "2",
      },
    });

    fireEvent.click(within(dialog).getByRole("checkbox"));

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Create product",
      }),
    );

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalledWith({
        categoryId: "category-1",

        name: "DMLS Crown",

        shortDescription: "Metal crown",

        /*
         * Default is false,
         * so clicking the checkbox
         * makes this true.
         */
        publicVisible: true,

        sortOrder: 2,
      });
    });
  });

  it("edits a product", async () => {
    updateProduct.mockResolvedValue({
      data: {
        product: {
          ...product,

          name: "Updated Zirconia Crown",
        },
      },
    });

    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    const productName = await screen.findByText("Zirconia Crown");

    const productCard = productName.closest("article");

    fireEvent.click(
      within(productCard).getByRole("button", {
        name: "Edit",
      }),
    );

    const dialog = screen.getByRole("dialog");

    const nameInput = within(dialog).getByLabelText("Product name");

    fireEvent.change(nameInput, {
      target: {
        value: "Updated Zirconia Crown",
      },
    });

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Save changes",
      }),
    );

    await waitFor(() => {
      expect(updateProduct).toHaveBeenCalledWith(
        "product-1",
        expect.objectContaining({
          categoryId: "category-1",

          name: "Updated Zirconia Crown",
        }),
      );
    });
  });

  it("disables an active product", async () => {
    disableProduct.mockResolvedValue({
      data: {
        product: {
          ...product,

          status: CATALOG_STATUS.DISABLED,
        },
      },
    });

    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    const productName = await screen.findByText("Zirconia Crown");

    const productCard = productName.closest("article");

    fireEvent.click(
      within(productCard).getByRole("button", {
        name: "Disable",
      }),
    );

    const dialog = screen.getByRole("alertdialog");

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Disable",
      }),
    );

    await waitFor(() => {
      expect(disableProduct).toHaveBeenCalledWith("product-1");
    });

    expect(getAdminProducts).toHaveBeenCalledTimes(2);
  });

  it("reactivates a disabled category", async () => {
    const disabledCategory = {
      ...category,

      status: CATALOG_STATUS.DISABLED,
    };

    getAdminCategories.mockResolvedValue({
      data: {
        categories: [disabledCategory],

        pagination: categoryResponse.data.pagination,
      },
    });

    activateCategory.mockResolvedValue({
      data: {
        category: {
          ...category,

          status: CATALOG_STATUS.ACTIVE,
        },
      },
    });

    renderWithStore(<AdminCatalogPage />, {
      preloadedState: adminState,
    });

    await screen.findByText("Zirconia Crown");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Categories",
      }),
    );

    const categoryName = await screen.findByText("Fixed Prosthesis");

    const categoryCard = categoryName.closest("article");

    fireEvent.click(
      within(categoryCard).getByRole("button", {
        name: "Reactivate",
      }),
    );

    const dialog = screen.getByRole("alertdialog");

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Reactivate",
      }),
    );

    await waitFor(() => {
      expect(activateCategory).toHaveBeenCalledWith("category-1");
    });
  });
});
