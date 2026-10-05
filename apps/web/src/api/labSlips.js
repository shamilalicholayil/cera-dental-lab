import { apiRequest } from "../lib/apiClient";

export function createLabSlip(payload) {
  return apiRequest("/lab-slips", {
    method: "POST",
    body: payload,
  });
}

export function getLabSlips({ search, clinicId, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (clinicId) {
    params.set("clinicId", clinicId);
  }

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiRequest(`/lab-slips?${params.toString()}`);
}

export function getLabSlip(labSlipId) {
  return apiRequest(`/lab-slips/${labSlipId}`);
}
