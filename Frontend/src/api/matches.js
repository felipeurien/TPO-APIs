import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

export function getMatches() {
  return apiGet("/partidos");
}

export function createMatch(data, token) {
  return apiPost("/partidos", data, { token });
}

export function updateMatch(id, data, token) {
  return apiPut(`/partidos/${id}`, data, { token });
}

export function updateMatchResult(id, data, token) {
  return apiPatch(`/partidos/${id}/resultado`, data, { token });
}

export function deleteMatch(id, token) {
  return apiDelete(`/partidos/${id}`, { token });
}
