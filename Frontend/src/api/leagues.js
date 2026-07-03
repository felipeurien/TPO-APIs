import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function getLeagues() {
  return apiGet("/ligas");
}

export function getLeagueById(id) {
  return apiGet(`/ligas/${id}`);
}

export function getLeagueStandings(id) {
  return apiGet(`/ligas/${id}/clasificacion`);
}

export function getLeaguePlayoffs(id) {
  return apiGet(`/ligas/${id}/playoffs`);
}

export function generateLeaguePlayoffs(id, token) {
  return apiPost(`/ligas/${id}/playoffs/generar`, {}, { token });
}

export function refreshLeaguePlayoffs(id, token) {
  return apiPost(`/ligas/${id}/playoffs/actualizar`, {}, { token });
}

export function createLeague(data, token) {
  return apiPost("/ligas", data, { token });
}

export function updateLeague(id, data, token) {
  return apiPut(`/ligas/${id}`, data, { token });
}

export function deleteLeague(id, token) {
  return apiDelete(`/ligas/${id}`, { token });
}
