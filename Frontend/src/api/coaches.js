import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function getCoaches() {
  return apiGet("/entrenadores");
}

export function getCoachById(id) {
  return apiGet(`/entrenadores/${id}`);
}

export function createCoach(data, token) {
  return apiPost("/entrenadores", data, { token });
}

export function updateCoach(id, data, token) {
  return apiPut(`/entrenadores/${id}`, data, { token });
}

export function deleteCoach(id, token) {
  return apiDelete(`/entrenadores/${id}`, { token });
}
