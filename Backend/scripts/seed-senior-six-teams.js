const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const leagueName = "Liga Metropolitana de Basket - Senior";
const categoryName = "Senior";
const seedMarker = "[SENIOR_6_SEED]";

const teams = [
  { name: "Banfield Senior", short: "BAN", shield: "/escudos/banfield.svg" },
  { name: "Ferro Carril Oeste Senior", short: "FER", shield: "https://en.wikipedia.org/wiki/Special:FilePath/Ferro%20Carril%20Oeste%20logo.svg" },
  { name: "Obras Sanitarias Senior", short: "OBR", shield: "https://en.wikipedia.org/wiki/Special:FilePath/Club%20obras%20logo14.png" },
  { name: "Atenas de Cordoba Senior", short: "ATE", shield: "https://en.wikipedia.org/wiki/Special:FilePath/Atenas%20cordoba%20logo.png" },
  { name: "Quimsa Senior", short: "QUI", shield: "https://en.wikipedia.org/wiki/Special:FilePath/Asociaci%C3%B3n%20Atl%C3%A9tica%20Quimsa%20logo.svg" },
  { name: "Boca Juniors Senior", short: "BOC", shield: "https://en.wikipedia.org/wiki/Special:FilePath/Boca%20Juniors%20logo18.svg" },
];

const firstNames = ["Carlos", "Hector", "Daniel", "Miguel", "Sergio", "Raul", "Oscar", "Pablo", "Jorge", "Ruben", "Marcelo", "Gustavo"];
const lastNames = ["Gomez", "Perez", "Lopez", "Fernandez", "Rodriguez", "Sanchez", "Romero", "Torres", "Molina", "Castro", "Alvarez", "Diaz"];
const times = ["18:00:00", "19:30:00", "21:00:00"];

function roundRobinRound(teamIds) {
  const ids = [...teamIds];
  const rounds = [];

  for (let round = 0; round < ids.length - 1; round += 1) {
    const pairs = [];

    for (let index = 0; index < ids.length / 2; index += 1) {
      const home = ids[index];
      const away = ids[ids.length - 1 - index];
      pairs.push(round % 2 === 0 ? [home, away] : [away, home]);
    }

    rounds.push(pairs);
    ids.splice(0, ids.length, ids[0], ids[ids.length - 1], ...ids.slice(1, ids.length - 1));
  }

  return rounds;
}

function makeDate(roundIndex) {
  const start = new Date(Date.UTC(2026, 2, 7));
  start.setUTCDate(start.getUTCDate() + roundIndex * 7);
  return start.toISOString().slice(0, 10);
}

function makeScore(roundIndex, matchIndex, homeId, awayId) {
  const home = 62 + ((roundIndex * 8 + matchIndex * 6 + homeId) % 24);
  const away = 58 + ((roundIndex * 5 + matchIndex * 7 + awayId) % 22);
  return home === away ? [home + 3, away] : [home, away];
}

async function insertAndGetId(conn, sql, params) {
  const [result] = await conn.execute(sql, params);
  return result.insertId;
}

async function cleanPreviousSeed(conn) {
  const [leagues] = await conn.query(
    "SELECT id_liga FROM ligas WHERE nombre = ? OR descripcion LIKE ?",
    [leagueName, `${seedMarker}%`],
  );

  if (leagues.length === 0) return;

  const leagueIds = leagues.map((league) => league.id_liga);
  const placeholders = leagueIds.map(() => "?").join(",");

  const [seedTeams] = await conn.query(
    `SELECT id_equipo, id_entrenador FROM equipos WHERE id_liga IN (${placeholders})`,
    leagueIds,
  );
  const teamIds = seedTeams.map((team) => team.id_equipo);
  const coachIds = [...new Set(seedTeams.map((team) => team.id_entrenador).filter(Boolean))];

  await conn.query(`DELETE FROM partidos WHERE id_liga IN (${placeholders})`, leagueIds);
  await conn.query(`DELETE FROM playoff_series WHERE id_liga IN (${placeholders})`, leagueIds);

  if (teamIds.length > 0) {
    const teamPlaceholders = teamIds.map(() => "?").join(",");
    await conn.query(`DELETE FROM jugadores WHERE id_equipo IN (${teamPlaceholders})`, teamIds);
    await conn.query(`DELETE FROM equipos WHERE id_equipo IN (${teamPlaceholders})`, teamIds);
  }

  if (coachIds.length > 0) {
    const coachPlaceholders = coachIds.map(() => "?").join(",");
    await conn.query(`DELETE FROM entrenadores WHERE id_entrenador IN (${coachPlaceholders})`, coachIds);
  }

  await conn.query(`DELETE FROM ligas WHERE id_liga IN (${placeholders})`, leagueIds);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });

  await conn.beginTransaction();

  try {
    await cleanPreviousSeed(conn);

    await conn.execute(
      "INSERT INTO categorias (nombre, descripcion, activa) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), activa = VALUES(activa)",
      [categoryName, "Categoria Senior para torneo reducido de prueba.", 1],
    );

    const idLiga = await insertAndGetId(
      conn,
      "INSERT INTO ligas (nombre, temporada_actual, descripcion, activa) VALUES (?, ?, ?, ?)",
      [leagueName, "2026", `${seedMarker} Torneo ida y vuelta de categoria Senior. Actualmente transitando la fecha 10.`, 1],
    );

    const createdTeams = [];

    for (const [teamIndex, team] of teams.entries()) {
      const idEntrenador = await insertAndGetId(
        conn,
        "INSERT INTO entrenadores (nombre, apellido) VALUES (?, ?)",
        [`DT ${team.short}`, "Senior"],
      );

      const idEquipo = await insertAndGetId(
        conn,
        "INSERT INTO equipos (nombre, categoria, id_entrenador, descripcion, escudo_url, activo, id_liga) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [team.name, categoryName, idEntrenador, `Equipo Senior de ${team.short}.`, team.shield, 1, idLiga],
      );

      createdTeams.push({ ...team, id: idEquipo });

      for (let playerIndex = 0; playerIndex < 10; playerIndex += 1) {
        await conn.execute(
          "INSERT INTO jugadores (nombre, apellido, categoria, id_equipo) VALUES (?, ?, ?, ?)",
          [
            firstNames[(playerIndex + teamIndex) % firstNames.length],
            lastNames[(playerIndex * 2 + teamIndex) % lastNames.length],
            categoryName,
            idEquipo,
          ],
        );
      }
    }

    const firstLeg = roundRobinRound(createdTeams.map((team) => team.id));
    const secondLeg = firstLeg.map((round) => round.map(([home, away]) => [away, home]));
    const fullSchedule = [...firstLeg, ...secondLeg];

    let totalMatches = 0;
    let playedMatches = 0;
    let pendingMatches = 0;

    for (const [roundIndex, round] of fullSchedule.entries()) {
      for (const [matchIndex, [homeId, awayId]] of round.entries()) {
        const homeTeam = createdTeams.find((team) => team.id === homeId);
        const isLastRound = roundIndex === fullSchedule.length - 1;
        const [homeScore, awayScore] = makeScore(roundIndex, matchIndex, homeId, awayId);

        await conn.execute(
          `INSERT INTO partidos (
            id_equipo_local,
            id_equipo_visitante,
            fecha,
            horario,
            lugar,
            resultado_local,
            resultado_visitante,
            estado,
            id_liga,
            numero_fecha,
            fase
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            homeId,
            awayId,
            makeDate(roundIndex),
            times[matchIndex],
            `Estadio ${homeTeam.short}`,
            isLastRound ? null : homeScore,
            isLastRound ? null : awayScore,
            isLastRound ? "programado" : "jugado",
            idLiga,
            roundIndex + 1,
            "regular",
          ],
        );

        totalMatches += 1;
        if (isLastRound) pendingMatches += 1;
        else playedMatches += 1;
      }
    }

    await conn.commit();
    console.log(JSON.stringify({
      id_liga: idLiga,
      categoria: categoryName,
      equipos: createdTeams.length,
      fechas: fullSchedule.length,
      partidos: totalMatches,
      jugados: playedMatches,
      pendientes: pendingMatches,
      ultima_fecha_pendiente: 10,
    }, null, 2));
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("Error poblando Senior:", error);
  process.exitCode = 1;
});
