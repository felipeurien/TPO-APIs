import { apiGet } from "./client";

export function getLeagues() {
  return apiGet("/ligas");
}

export function getLeagueById(id) {
  return apiGet(`/ligas/${id}`);
}

export function getLeagueStandings(id) {
  return apiGet(`/ligas/${id}/clasificacion`);
}
