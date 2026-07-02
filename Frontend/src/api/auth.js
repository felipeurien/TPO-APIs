import { apiPost } from "./client";

export function loginAdmin(credentials) {
  return apiPost("/auth/login", credentials);
}
