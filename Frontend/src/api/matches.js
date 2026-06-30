import { apiGet } from "./client";

export function getMatches() {
  return apiGet("/partidos");
}
