import { apiRequest } from "../lib/apiClient";

export function getAdminCategories({
  search,
  status,
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status) {
    params.set("status", status);
  }

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiRequest(`/admin/catalog/categories?${params.toString()}`);
}

export function createCategory(payload) {
  return apiRequest("/admin/catalog/categories", {
    method: "POST",
    body: payload,
  });
}

export function updateCategory(categoryId, payload) {
  return apiRequest(`/admin/catalog/categories/${categoryId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function disableCategory(categoryId) {
  return apiRequest(`/admin/catalog/categories/${categoryId}/disable`, {
    method: "POST",
  });
}

export function activateCategory(categoryId) {
  return apiRequest(`/admin/catalog/categories/${categoryId}/activate`, {
    method: "POST",
  });
}

export function getAdminProducts({
  search,
  categoryId,
  status,
  publicVisible,
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (categoryId) {
    params.set("categoryId", categoryId);
  }

  if (status) {
    params.set("status", status);
  }

  if (publicVisible !== undefined && publicVisible !== "") {
    params.set("publicVisible", String(publicVisible));
  }

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiRequest(`/admin/catalog/products?${params.toString()}`);
}

export function createProduct(payload) {
  return apiRequest("/admin/catalog/products", {
    method: "POST",
    body: payload,
  });
}

export function updateProduct(productId, payload) {
  return apiRequest(`/admin/catalog/products/${productId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function disableProduct(productId) {
  return apiRequest(`/admin/catalog/products/${productId}/disable`, {
    method: "POST",
  });
}

export function activateProduct(productId) {
  return apiRequest(`/admin/catalog/products/${productId}/activate`, {
    method: "POST",
  });
}

/*
 * Reused later by Lab Slip creation.
 */
export function getCatalogCategories() {
  return apiRequest("/catalog/categories");
}

export function getCatalogProducts({ search, categoryId } = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (categoryId) {
    params.set("categoryId", categoryId);
  }

  const query = params.toString();

  return apiRequest(`/catalog/products${query ? `?${query}` : ""}`);
}
