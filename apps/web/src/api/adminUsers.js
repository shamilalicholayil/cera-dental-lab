import { apiRequest } from "../lib/apiClient";

export function getAdminUsers({
  search,
  role,
  status,
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (role) {
    params.set("role", role);
  }

  if (status) {
    params.set("status", status);
  }

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiRequest(`/admin/users?${params.toString()}`);
}

export function disableAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}/disable`, {
    method: "POST",
  });
}

export function activateAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}/activate`, {
    method: "POST",
  });
}
