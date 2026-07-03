export function formatDate(value) {
  if (!value) return "Fecha a confirmar";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(value) {
  if (!value) return "--/--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5, 10).replace("-", "/");
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function getDateKey(value) {
  if (!value) return "Sin fecha";
  return String(value).slice(0, 10);
}

export function parseDateKey(value) {
  const key = getDateKey(value);
  const [year, month, day] = key.split("-").map(Number);

  if (!year || !month || !day) return null;

  return { key, year, monthIndex: month - 1, day };
}

export function getScore(match) {
  const hasScore =
    match.resultado_local !== null &&
    match.resultado_local !== undefined &&
    match.resultado_visitante !== null &&
    match.resultado_visitante !== undefined;

  return hasScore
    ? `${match.resultado_local} - ${match.resultado_visitante}`
    : "vs.";
}

export function getTeamCode(name) {
  return (name || "---")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

export function isPlayed(match) {
  return (
    match.estado === "jugado" ||
    match.estado === "finalizado" ||
    (match.resultado_local !== null && match.resultado_visitante !== null)
  );
}

export function getPersonName(person) {
  return [person?.nombre, person?.apellido].filter(Boolean).join(" ") || "Sin nombre";
}

export function getLeagueCategory(league) {
  return league?.nombre?.split(" - ").pop() || league?.nombre || "Liga";
}

export function getLeagueRound(league) {
  if (league?.fecha_actual) {
    return String(league.fecha_actual);
  }

  const match = league?.descripcion?.match(/fecha\s+(\d+)/i);
  return match?.[1] || "";
}
