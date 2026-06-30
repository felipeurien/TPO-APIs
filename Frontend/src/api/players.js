import { apiGet } from "./client";

export function getPlayers() {
  return apiGet("/jugadores");
}

export function getPlayerById(id) {
  return apiGet(`/jugadores/${id}`);
}
