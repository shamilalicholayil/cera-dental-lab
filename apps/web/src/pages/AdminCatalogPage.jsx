import { useEffect, useState } from "react";

import { CATALOG_STATUS } from "@cera/shared";

import {
  activateCategory,
  activateProduct,
  createCategory,
  createProduct,
  disableCategory,
  disableProduct,
  getAdminCategories,
  getAdminProducts,
  updateCategory,
  updateProduct,
} from "../api/catalog";

import { PortalHeader } from "../components/portal/PortalHeader";

import { CATALOG_STATUS_LABELS } from "../constants/catalogDisplay";

function StatusBadge({ status }) {
  const active = status === CATALOG_STATUS.ACTIVE;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {CATALOG_STATUS_LABELS[status] || status}
    </span>
  );
}

function CategoryFormModal({ category, onClose, onSaved }) {
  const editing = Boolean(category);

  const [form, setForm] = useState({
    name: category?.name || "",

    description: category?.description || "",

    sortOrder: category?.sortOrder ?? 0,
  });

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: form.name.trim(),

        description: form.description.trim(),

        sortOrder: Number(form.sortOrder),
      };

      const response = editing
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);

      onSaved(response.data.category);
    } catch (requestError) {
      setError(requestError.message || "Unable to save category.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="mx-auto w-full max-w-xl rounded-3xl border border-[var(--cera-border)] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--cera-border)] px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Catalogue
            </p>

            <h2
              id="category-form-title"
              className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
            >
              {editing ? "Edit category" : "Add category"}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close category form"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-medium"
            >
              Category name
            </label>

            <input
              id="category-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  name: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
            />
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="category-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  description: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-[var(--cera-border)] px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="category-sort"
              className="mb-2 block text-sm font-medium"
            >
              Sort order
            </label>

            <input
              id="category-sort"
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  sortOrder: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--cera-border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : "Create category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductFormModal({ product, categories, onClose, onSaved }) {
  const editing = Boolean(product);

  const [form, setForm] = useState({
    categoryId: product?.category?.id || "",

    name: product?.name || "",

    shortDescription: product?.shortDescription || "",

    publicVisible: product?.publicVisible || false,

    sortOrder: product?.sortOrder ?? 0,
  });

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  /*
   * New products can only use active categories.
   * While editing, keep the existing category visible
   * even when that category is currently disabled.
   */
  const selectableCategories = categories.filter(
    (category) =>
      category.status === CATALOG_STATUS.ACTIVE ||
      category.id === product?.category?.id,
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.categoryId) {
      setError("Product name and category are required.");

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        categoryId: form.categoryId,

        name: form.name.trim(),

        shortDescription: form.shortDescription.trim(),

        publicVisible: Boolean(form.publicVisible),

        sortOrder: Number(form.sortOrder),
      };

      const response = editing
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      onSaved(response.data.product);
    } catch (requestError) {
      setError(requestError.message || "Unable to save product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="mx-auto w-full max-w-2xl rounded-3xl border border-[var(--cera-border)] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--cera-border)] px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Catalogue
            </p>

            <h2
              id="product-form-title"
              className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
            >
              {editing ? "Edit product" : "Add product"}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close product form"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="product-category"
              className="mb-2 block text-sm font-medium"
            >
              Category
            </label>

            <select
              id="product-category"
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  categoryId: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
            >
              <option value="">Select category</option>

              {selectableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.status === CATALOG_STATUS.DISABLED
                    ? " (Disabled)"
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-name"
              className="mb-2 block text-sm font-medium"
            >
              Product name
            </label>

            <input
              id="product-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  name: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
            />
          </div>

          <div>
            <label
              htmlFor="product-description"
              className="mb-2 block text-sm font-medium"
            >
              Short description
            </label>

            <textarea
              id="product-description"
              rows={4}
              value={form.shortDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  shortDescription: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-[var(--cera-border)] px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="product-sort"
              className="mb-2 block text-sm font-medium"
            >
              Sort order
            </label>

            <input
              id="product-sort"
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  sortOrder: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--cera-border)] p-4">
            <input
              type="checkbox"
              checked={form.publicVisible}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  publicVisible: event.target.checked,
                }))
              }
              className="mt-1"
            />

            <span>
              <span className="block text-sm font-semibold text-[var(--cera-navy-950)]">
                Show on public website
              </span>

              <span className="mt-1 block text-sm text-[var(--cera-text-muted)]">
                This only marks the product as eligible. The public catalogue
                endpoint will be added later.
              </span>
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--cera-border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmAction({ action, busy, onCancel, onConfirm }) {
  const enabling = action.operation === "activate";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-[var(--cera-border)] bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold text-[var(--cera-navy-950)]">
          {enabling
            ? `Reactivate ${action.entity}?`
            : `Disable ${action.entity}?`}
        </h2>

        <p className="mt-3 leading-6 text-[var(--cera-text-muted)]">
          {enabling
            ? `${action.name} will become available again.`
            : `${action.name} will no longer be available in the active catalogue.`}
        </p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-11 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60 ${
              enabling ? "bg-[var(--cera-navy-900)]" : "bg-red-600"
            }`}
          >
            {busy ? "Working..." : enabling ? "Reactivate" : "Disable"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState("products");

  const [categories, setCategories] = useState([]);

  const [categoryOptions, setCategoryOptions] = useState([]);

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [categorySearch, setCategorySearch] = useState("");

  const [categoryFilters, setCategoryFilters] = useState({
    search: "",
    status: "",
    page: 1,
  });

  const [productSearch, setProductSearch] = useState("");

  const [productFilters, setProductFilters] = useState({
    search: "",
    categoryId: "",
    status: "",
    page: 1,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [categoryForm, setCategoryForm] = useState(null);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  const [productForm, setProductForm] = useState(null);

  const [productFormOpen, setProductFormOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (activeTab === "categories") {
      getAdminCategories(categoryFilters)
        .then((response) => {
          if (cancelled) {
            return;
          }

          setCategories(response.data.categories);

          setPagination(response.data.pagination);

          setError(null);
        })
        .catch((requestError) => {
          if (!cancelled) {
            setError(requestError.message || "Unable to load categories.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    } else {
      Promise.all([
        getAdminProducts(productFilters),

        getAdminCategories({
          page: 1,
          limit: 100,
        }),
      ])
        .then(([productResponse, categoryResponse]) => {
          if (cancelled) {
            return;
          }

          setProducts(productResponse.data.products);

          setPagination(productResponse.data.pagination);

          setCategoryOptions(categoryResponse.data.categories);

          setError(null);
        })
        .catch((requestError) => {
          if (!cancelled) {
            setError(requestError.message || "Unable to load catalogue.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, categoryFilters, productFilters]);

  async function reloadCurrent() {
    if (activeTab === "categories") {
      const response = await getAdminCategories(categoryFilters);

      setCategories(response.data.categories);

      setPagination(response.data.pagination);

      return;
    }

    const [productResponse, categoryResponse] = await Promise.all([
      getAdminProducts(productFilters),

      getAdminCategories({
        page: 1,
        limit: 100,
      }),
    ]);

    setProducts(productResponse.data.products);

    setPagination(productResponse.data.pagination);

    setCategoryOptions(categoryResponse.data.categories);
  }

  function changeTab(tab) {
    setLoading(true);
    setError(null);
    setActiveTab(tab);
  }

  async function saved() {
    setCategoryFormOpen(false);

    setProductFormOpen(false);

    setCategoryForm(null);

    setProductForm(null);

    try {
      await reloadCurrent();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Saved, but the catalogue could not be refreshed.",
      );
    }
  }

  async function performAction() {
    if (!confirmAction) {
      return;
    }

    try {
      setActionBusy(true);
      setError(null);

      const { entity, operation, id } = confirmAction;

      if (entity === "category") {
        if (operation === "disable") {
          await disableCategory(id);
        } else {
          await activateCategory(id);
        }
      } else if (operation === "disable") {
        await disableProduct(id);
      } else {
        await activateProduct(id);
      }

      await reloadCurrent();

      setConfirmAction(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to update catalogue.");
    } finally {
      setActionBusy(false);
    }
  }

  function changePage(page) {
    setLoading(true);

    if (activeTab === "categories") {
      setCategoryFilters((current) => ({
        ...current,
        page,
      }));
    } else {
      setProductFilters((current) => ({
        ...current,
        page,
      }));
    }
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--cera-navy-950)]">
              Product catalogue
            </h1>

            <p className="mt-2 max-w-2xl text-[var(--cera-text-muted)]">
              Manage the products Cera accepts on Digital Lab Slips and prepares
              for the public website.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === "categories") {
                setCategoryForm(null);

                setCategoryFormOpen(true);
              } else {
                setProductForm(null);

                setProductFormOpen(true);
              }
            }}
            className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
          >
            {activeTab === "categories" ? "+ Add category" : "+ Add product"}
          </button>
        </div>

        <div className="mt-8 border-b border-[var(--cera-border)]">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => changeTab("products")}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === "products"
                  ? "border-[var(--cera-blue-600)] text-[var(--cera-navy-950)]"
                  : "border-transparent text-[var(--cera-text-muted)]"
              }`}
            >
              Products
            </button>

            <button
              type="button"
              onClick={() => changeTab("categories")}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === "categories"
                  ? "border-[var(--cera-blue-600)] text-[var(--cera-navy-950)]"
                  : "border-transparent text-[var(--cera-text-muted)]"
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {activeTab === "products" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();

              setLoading(true);

              setProductFilters((current) => ({
                ...current,

                search: productSearch.trim(),

                page: 1,
              }));
            }}
            className="mt-6 grid gap-3 rounded-2xl border border-[var(--cera-border)] bg-white p-4 md:grid-cols-[1fr_220px_180px_auto]"
          >
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search products"
              className="h-11 rounded-xl border border-[var(--cera-border)] px-4"
            />

            <select
              aria-label="Product category"
              value={productFilters.categoryId}
              onChange={(event) => {
                setLoading(true);

                setProductFilters((current) => ({
                  ...current,

                  categoryId: event.target.value,

                  page: 1,
                }));
              }}
              className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
            >
              <option value="">All categories</option>

              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Product status"
              value={productFilters.status}
              onChange={(event) => {
                setLoading(true);

                setProductFilters((current) => ({
                  ...current,

                  status: event.target.value,

                  page: 1,
                }));
              }}
              className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
            >
              <option value="">All statuses</option>

              <option value={CATALOG_STATUS.ACTIVE}>Active</option>

              <option value={CATALOG_STATUS.DISABLED}>Disabled</option>
            </select>

            <button
              type="submit"
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            >
              Search
            </button>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();

              setLoading(true);

              setCategoryFilters((current) => ({
                ...current,

                search: categorySearch.trim(),

                page: 1,
              }));
            }}
            className="mt-6 grid gap-3 rounded-2xl border border-[var(--cera-border)] bg-white p-4 md:grid-cols-[1fr_180px_auto]"
          >
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search categories"
              className="h-11 rounded-xl border border-[var(--cera-border)] px-4"
            />

            <select
              aria-label="Category status"
              value={categoryFilters.status}
              onChange={(event) => {
                setLoading(true);

                setCategoryFilters((current) => ({
                  ...current,

                  status: event.target.value,

                  page: 1,
                }));
              }}
              className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
            >
              <option value="">All statuses</option>

              <option value={CATALOG_STATUS.ACTIVE}>Active</option>

              <option value={CATALOG_STATUS.DISABLED}>Disabled</option>
            </select>

            <button
              type="submit"
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            >
              Search
            </button>
          </form>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
              Loading catalogue...
            </div>
          ) : activeTab === "products" ? (
            products.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
                No products found.
              </div>
            ) : (
              <div className="divide-y divide-[var(--cera-border)]">
                {products.map((product) => (
                  <article key={product.id} className="p-5">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-semibold text-[var(--cera-navy-950)]">
                            {product.name}
                          </h2>

                          <StatusBadge status={product.status} />

                          {product.publicVisible && (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                              Public
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
                          {product.category?.name}
                        </p>

                        {product.shortDescription && (
                          <p className="mt-1 max-w-3xl text-sm text-[var(--cera-text-muted)]">
                            {product.shortDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(product);

                            setProductFormOpen(true);
                          }}
                          className="text-sm font-medium text-[var(--cera-navy-950)]"
                        >
                          Edit
                        </button>

                        {product.status === CATALOG_STATUS.ACTIVE ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                entity: "product",

                                operation: "disable",

                                id: product.id,

                                name: product.name,
                              })
                            }
                            className="text-sm font-medium text-red-600"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                entity: "product",

                                operation: "activate",

                                id: product.id,

                                name: product.name,
                              })
                            }
                            className="text-sm font-medium text-[var(--cera-blue-600)]"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : categories.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
              No categories found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--cera-border)]">
              {categories.map((category) => (
                <article key={category.id} className="p-5">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold text-[var(--cera-navy-950)]">
                          {category.name}
                        </h2>

                        <StatusBadge status={category.status} />
                      </div>

                      {category.description && (
                        <p className="mt-2 max-w-3xl text-sm text-[var(--cera-text-muted)]">
                          {category.description}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                        Sort order: {category.sortOrder}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryForm(category);

                          setCategoryFormOpen(true);
                        }}
                        className="text-sm font-medium text-[var(--cera-navy-950)]"
                      >
                        Edit
                      </button>

                      {category.status === CATALOG_STATUS.ACTIVE ? (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              entity: "category",

                              operation: "disable",

                              id: category.id,

                              name: category.name,
                            })
                          }
                          className="text-sm font-medium text-red-600"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              entity: "category",

                              operation: "activate",

                              id: category.id,

                              name: category.name,
                            })
                          }
                          className="text-sm font-medium text-[var(--cera-blue-600)]"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-[var(--cera-text-muted)]">
              {pagination.total}{" "}
              {activeTab === "products" ? "products" : "categories"}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changePage(pagination.page - 1)}
                className="h-10 rounded-xl border border-[var(--cera-border)] px-4 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => changePage(pagination.page + 1)}
                className="h-10 rounded-xl border border-[var(--cera-border)] px-4 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {categoryFormOpen && (
        <CategoryFormModal
          category={categoryForm}
          onClose={() => setCategoryFormOpen(false)}
          onSaved={saved}
        />
      )}

      {productFormOpen && (
        <ProductFormModal
          product={productForm}
          categories={categoryOptions}
          onClose={() => setProductFormOpen(false)}
          onSaved={saved}
        />
      )}

      {confirmAction && (
        <ConfirmAction
          action={confirmAction}
          busy={actionBusy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={performAction}
        />
      )}
    </main>
  );
}
