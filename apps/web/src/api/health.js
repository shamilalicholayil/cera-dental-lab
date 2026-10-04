import { apiRequest } from "../lib/apiClient";

export function getHealth() {
  return apiRequest("/health");
}
