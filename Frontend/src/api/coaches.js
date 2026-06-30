import { apiGet } from "./client";

export function getCoaches() {
  return apiGet("/entrenadores");
}

export function getCoachById(id) {
  return apiGet(`/entrenadores/${id}`);
}
