import { apiRequest } from "../lib/apiClient";

export function createScanBooking(payload) {
  return apiRequest("/scan-bookings", {
    method: "POST",
    body: payload,
  });
}

export function getScanBookings({
  status,
  clinicId,
  labSlipId,
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (clinicId) {
    params.set("clinicId", clinicId);
  }

  if (labSlipId) {
    params.set("labSlipId", labSlipId);
  }

  params.set("page", String(page));

  params.set("limit", String(limit));

  return apiRequest(`/scan-bookings?${params.toString()}`);
}

export function getScanBooking(bookingId) {
  return apiRequest(`/scan-bookings/${bookingId}`);
}

export function confirmScanBooking(bookingId) {
  return apiRequest(`/scan-bookings/${bookingId}/confirm`, {
    method: "POST",
  });
}

export function proposeAlternateScanTime(bookingId, proposedStartAt) {
  return apiRequest(`/scan-bookings/${bookingId}/propose-alternate`, {
    method: "POST",

    body: {
      proposedStartAt,
    },
  });
}

export function acceptAlternateScanTime(bookingId) {
  return apiRequest(`/scan-bookings/${bookingId}/accept-alternate`, {
    method: "POST",
  });
}

export function rejectScanBooking(bookingId, reason) {
  return apiRequest(`/scan-bookings/${bookingId}/reject`, {
    method: "POST",

    body: {
      reason,
    },
  });
}

export function assignScanBooking(bookingId, scanningStaffId) {
  return apiRequest(`/scan-bookings/${bookingId}/assign`, {
    method: "POST",

    body: {
      scanningStaffId,
    },
  });
}

export function completeScanBooking(bookingId) {
  return apiRequest(`/scan-bookings/${bookingId}/complete`, {
    method: "POST",
  });
}

export function cancelScanBooking(bookingId, reason = "") {
  return apiRequest(`/scan-bookings/${bookingId}/cancel`, {
    method: "POST",

    body: {
      reason,
    },
  });
}

export function getScanningStaff() {
  return apiRequest("/scan-bookings/scanning-staff");
}
