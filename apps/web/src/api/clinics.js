import { apiRequest } from "../lib/apiClient";

export function getAdminClinics({
  search,
  type,
  status,
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (type) {
    params.set("type", type);
  }

  if (status) {
    params.set("status", status);
  }

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiRequest(`/admin/clinics?${params.toString()}`);
}

export function getAdminClinic(clinicId) {
  return apiRequest(`/admin/clinics/${clinicId}`);
}

export function createClinic(payload) {
  return apiRequest("/admin/clinics", {
    method: "POST",
    body: payload,
  });
}

export function updateClinic(clinicId, payload) {
  return apiRequest(`/admin/clinics/${clinicId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function disableClinic(clinicId) {
  return apiRequest(`/admin/clinics/${clinicId}/disable`, {
    method: "POST",
  });
}

export function activateClinic(clinicId) {
  return apiRequest(`/admin/clinics/${clinicId}/activate`, {
    method: "POST",
  });
}

export function getClinicMembers(clinicId) {
  return apiRequest(`/admin/clinics/${clinicId}/members`);
}

export function addClinicMember(clinicId, userId) {
  return apiRequest(`/admin/clinics/${clinicId}/members`, {
    method: "POST",

    body: {
      userId,
    },
  });
}

export function removeClinicMember(clinicId, userId) {
  return apiRequest(`/admin/clinics/${clinicId}/members/${userId}`, {
    method: "DELETE",
  });
}

/*
 * Reusable later for Doctor / Clinic Staff
 * when creating Lab Slips.
 */
export function getAccessibleClinics({ search } = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();

  return apiRequest(`/clinics${query ? `?${query}` : ""}`);
}

export function getAccessibleClinic(clinicId) {
  return apiRequest(`/clinics/${clinicId}`);
}
