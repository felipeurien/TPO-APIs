import { apiGet, apiPost } from "./client";

export function getAdmins(token) {
  return apiGet("/administradores", { token });
}

export function createAdmin(data, token) {
  return apiPost("/administradores", data, { token });
}
