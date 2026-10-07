import { apiRequest } from "../lib/apiClient";

export function getProductions({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  params.set("page", String(page));
  params.set("limit", String(limit));

  return apiRequest(`/productions?${params.toString()}`);
}

export function getProduction(productionId) {
  return apiRequest(`/productions/${productionId}`);
}

export function startProduction(productionId, note = "") {
  return apiRequest(`/productions/${productionId}/start`, {
    method: "POST",

    body: {
      note,
    },
  });
}

export function completeProduction(productionId, note = "") {
  return apiRequest(`/productions/${productionId}/complete`, {
    method: "POST",

    body: {
      note,
    },
  });
}

export function moveProductionBack(productionId, targetStatus, reason) {
  return apiRequest(`/productions/${productionId}/move-back`, {
    method: "POST",

    body: {
      targetStatus,
      reason,
    },
  });
}
