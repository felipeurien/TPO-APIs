import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function getTeams() {
  return apiGet("/equipos");
}

export function getTeamById(id) {
  return apiGet(`/equipos/${id}`);
}

export function createTeam(data, token) {
  return apiPost("/equipos", data, { token });
}

export function updateTeam(id, data, token) {
  return apiPut(`/equipos/${id}`, data, { token });
}

export function deleteTeam(id, token) {
  return apiDelete(`/equipos/${id}`, { token });
}
