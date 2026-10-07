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

export function updateLabSlip(labSlipId, payload) {
  return apiRequest(`/lab-slips/${labSlipId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function uploadLabSlipAttachment(labSlipId, file) {
  const body = new FormData();

  body.append("attachment", file);

  return apiRequest(`/lab-slips/${labSlipId}/attachments`, {
    method: "POST",
    body,
  });
}

export function getLabSlipAttachments(labSlipId) {
  return apiRequest(`/lab-slips/${labSlipId}/attachments`);
}

export function getLabSlipAttachmentAccess(labSlipId, attachmentId) {
  return apiRequest(
    `/lab-slips/${labSlipId}/attachments/${attachmentId}/access`,
  );
}

export function deleteLabSlipAttachment(labSlipId, attachmentId) {
  return apiRequest(`/lab-slips/${labSlipId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}
