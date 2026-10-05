import { apiRequest } from "../lib/apiClient";

export function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",

    body: credentials,

    skipAuthRefresh: true,
  });
}

export function getCurrentUser() {
  return apiRequest("/auth/me");
}

export function logoutUser() {
  return apiRequest("/auth/logout", {
    method: "POST",

    skipAuthRefresh: true,
  });
}
