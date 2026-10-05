import { apiRequest } from "../lib/apiClient";

export function getInvitations() {
  return apiRequest("/admin/invitations");
}

export function createInvitation(payload) {
  return apiRequest("/admin/invitations", {
    method: "POST",
    body: payload,
  });
}

export function revokeInvitation(invitationId) {
  return apiRequest(`/admin/invitations/${invitationId}/revoke`, {
    method: "POST",
  });
}

export function regenerateInvitation(invitationId) {
  return apiRequest(`/admin/invitations/${invitationId}/regenerate`, {
    method: "POST",
  });
}

export function previewInvitation(token) {
  return apiRequest("/invitations/preview", {
    method: "POST",

    body: {
      token,
    },

    skipAuthRefresh: true,
  });
}

export function acceptInvitation({ token, password }) {
  return apiRequest("/invitations/accept", {
    method: "POST",

    body: {
      token,
      password,
    },

    skipAuthRefresh: true,
  });
}
