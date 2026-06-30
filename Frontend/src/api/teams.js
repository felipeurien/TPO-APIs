import { apiGet } from "./client";

export function getTeams() {
  return apiGet("/equipos");
}

export function getTeamById(id) {
  return apiGet(`/equipos/${id}`);
}
