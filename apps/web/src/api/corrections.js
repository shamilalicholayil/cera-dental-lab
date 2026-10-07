import { apiRequest } from "../lib/apiClient";

export function getCorrections({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  params.set("page", String(page));
  params.set("limit", String(limit));

  return apiRequest(`/corrections?${params.toString()}`);
}

export function getCorrection(correctionId) {
  return apiRequest(`/corrections/${correctionId}`);
}

export function createCorrection(payload) {
  return apiRequest("/corrections", {
    method: "POST",
    body: payload,
  });
}

export function startCorrectionReview(correctionId, note = "") {
  return apiRequest(`/corrections/${correctionId}/start-review`, {
    method: "POST",
    body: {
      note,
    },
  });
}

export function requestCorrectionClarification(correctionId, note) {
  return apiRequest(`/corrections/${correctionId}/request-clarification`, {
    method: "POST",
    body: {
      note,
    },
  });
}

export function respondToCorrectionClarification(correctionId, note) {
  return apiRequest(`/corrections/${correctionId}/respond-clarification`, {
    method: "POST",
    body: {
      note,
    },
  });
}

export function resolveCorrection(correctionId, outcome, note = "") {
  return apiRequest(`/corrections/${correctionId}/resolve`, {
    method: "POST",
    body: {
      outcome,
      note,
    },
  });
}

export function rejectCorrection(correctionId, note = "") {
  return apiRequest(`/corrections/${correctionId}/reject`, {
    method: "POST",
    body: {
      note,
    },
  });
}

export function getCorrectionAttachments(correctionId) {
  return apiRequest(`/corrections/${correctionId}/attachments`);
}

export function uploadCorrectionAttachment(correctionId, file) {
  const body = new FormData();

  body.append("attachment", file);

  return apiRequest(`/corrections/${correctionId}/attachments`, {
    method: "POST",
    body,
  });
}

export function getCorrectionAttachmentAccess(correctionId, attachmentId) {
  return apiRequest(
    `/corrections/${correctionId}/attachments/${attachmentId}/access`,
  );
}

export function deleteCorrectionAttachment(correctionId, attachmentId) {
  return apiRequest(
    `/corrections/${correctionId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
    },
  );
}

export function getActiveCorrectionForLabSlip(labSlipId) {
  return apiRequest(`/corrections/lab-slip/${labSlipId}/active`);
}
