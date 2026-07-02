import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function getPlayers() {
  return apiGet("/jugadores");
}

export function getPlayerById(id) {
  return apiGet(`/jugadores/${id}`);
}

export function createPlayer(data, token) {
  return apiPost("/jugadores", data, { token });
}

export function updatePlayer(id, data, token) {
  return apiPut(`/jugadores/${id}`, data, { token });
}

export function deletePlayer(id, token) {
  return apiDelete(`/jugadores/${id}`, { token });
}
