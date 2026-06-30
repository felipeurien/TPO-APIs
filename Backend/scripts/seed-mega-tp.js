const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const clubs = [
  {
    name: "Banfield",
    short: "BAN",
    shieldUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/CA%20Banfield%20(2014).svg",
    description: "Easter egg invitado: Banfield abre la lista de equipos históricos.",
  },
  {
    name: "Atenas de Córdoba",
    short: "ATE",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Atenas%20cordoba%20logo.png",
    description: "Club histórico de Córdoba y referencia del básquet nacional.",
  },
  {
    name: "Peñarol de Mar del Plata",
    short: "PEN",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Penarol%20mardel%20crest.png",
    description: "Institución marplatense con enorme tradición en la Liga Nacional.",
  },
  {
    name: "Ferro Carril Oeste",
    short: "FER",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Ferro%20Carril%20Oeste%20logo.svg",
    description: "Equipo clásico de Caballito y protagonista histórico del básquet argentino.",
  },
  {
    name: "Obras Sanitarias",
    short: "OBR",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Club%20obras%20logo14.png",
    description: "El rock del básquet argentino, emblema porteño de la disciplina.",
  },
  {
    name: "Boca Juniors",
    short: "BOC",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Boca%20Juniors%20logo18.svg",
    description: "Club de fuerte presencia nacional también en básquet.",
  },
  {
    name: "San Lorenzo",
    short: "CASLA",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/San%20lorenzo%20almagro%20logo.svg",
    description: "Protagonista moderno con peso institucional e historia deportiva.",
  },
  {
    name: "Quimsa",
    short: "QUI",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Asociaci%C3%B3n%20Atl%C3%A9tica%20Quimsa%20logo.svg",
    description: "Potencia santiagueña de gran crecimiento competitivo.",
  },
  {
    name: "Instituto de Córdoba",
    short: "INS",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Instituto%20acc%20cordoba%20logo.svg",
    description: "Representante cordobés con presente fuerte y tradición formativa.",
  },
  {
    name: "Regatas Corrientes",
    short: "REG",
    shieldUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Crc%20regatas.png",
    description: "Equipo correntino reconocido por su historia nacional e internacional.",
  },
];

const categories = [
  { name: "Primera", playerCategory: "Primera" },
  { name: "U21", playerCategory: "U21" },
  { name: "U19", playerCategory: "U19" },
  { name: "U17", playerCategory: "U17" },
  { name: "U15", playerCategory: "U15" },
  { name: "U13", playerCategory: "U13" },
];

const firstNames = [
  "Mateo", "Santiago", "Benjamín", "Julián", "Tomás", "Nicolás",
  "Bruno", "Facundo", "Lautaro", "Thiago", "Valentino", "Bautista",
];

const lastNames = [
  "Gómez", "Rodríguez", "Fernández", "López", "Martínez", "Pérez",
  "Sánchez", "Romero", "Torres", "Álvarez", "Molina", "Castro",
];

function leagueName(category) {
  return `Liga Metropolitana de Basket - ${category.name}`;
}

function teamName(club, category) {
  return `${club.name} ${category.name}`;
}

function coachFor(club, categoryIndex) {
  return {
    nombre: `DT ${club.short}`,
    apellido: categoryIndex === 0 ? "Mayor" : categoryIndex === 1 ? "Reserva" : categoryIndex === 2 ? "Juvenil" : categoryIndex === 3 ? "Cadete" : categoryIndex === 4 ? "Infantil" : "Mini",
  };
}

function roundRobinRound(teams) {
  const ids = [...teams];
  const rounds = [];

  for (let round = 0; round < ids.length - 1; round += 1) {
    const pairs = [];

    for (let i = 0; i < ids.length / 2; i += 1) {
      const home = ids[i];
      const away = ids[ids.length - 1 - i];
      pairs.push(round % 2 === 0 ? [home, away] : [away, home]);
    }

    rounds.push(pairs);
    const fixed = ids[0];
    const rotated = [ids[ids.length - 1], ...ids.slice(1, ids.length - 1)];
    ids.splice(0, ids.length, fixed, ...rotated);
  }

  return rounds;
}

function makeDate(roundIndex) {
  const start = new Date(Date.UTC(2026, 2, 1));
  start.setUTCDate(start.getUTCDate() + roundIndex * 7);
  return start.toISOString().slice(0, 10);
}

function makeTime(matchIndex) {
  const times = ["18:00:00", "19:30:00", "20:00:00", "20:30:00", "21:30:00"];
  return times[matchIndex % times.length];
}

function makeScore(roundIndex, matchIndex, categoryIndex, legIndex) {
  const baseHome = 58 + ((roundIndex * 7 + matchIndex * 5 + categoryIndex * 3 + legIndex * 4) % 35);
  const baseAway = 54 + ((roundIndex * 4 + matchIndex * 6 + categoryIndex * 5 + legIndex * 2) % 34);

  if ((roundIndex + matchIndex + categoryIndex + legIndex) % 17 === 0) {
    return [baseHome, baseHome];
  }

  return [baseHome, baseAway];
}

async function insertAndGetId(conn, sql, params) {
  const [result] = await conn.execute(sql, params);
  return result.insertId;
}

async function cleanPreviousSeed(conn) {
  const [seedLeagues] = await conn.query(
    "SELECT id_liga FROM ligas WHERE nombre LIKE ? OR nombre IN (?)",
    ["[MEGA_SEED_TP]%", categories.map(leagueName)],
  );

  if (seedLeagues.length === 0) return;

  const leagueIds = seedLeagues.map((league) => league.id_liga);
  const placeholders = leagueIds.map(() => "?").join(",");

  const [seedTeams] = await conn.query(
    `SELECT id_equipo, id_entrenador FROM equipos WHERE id_liga IN (${placeholders})`,
    leagueIds,
  );

  const teamIds = seedTeams.map((team) => team.id_equipo);
  const coachIds = [...new Set(seedTeams.map((team) => team.id_entrenador).filter(Boolean))];

  await conn.query(`DELETE FROM partidos WHERE id_liga IN (${placeholders})`, leagueIds);

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

    let totalLeagues = 0;
    let totalTeams = 0;
    let totalPlayers = 0;
    let totalMatches = 0;
    let playedMatches = 0;
    let scheduledMatches = 0;

    for (const [categoryIndex, category] of categories.entries()) {
      const idLiga = await insertAndGetId(
        conn,
        `INSERT INTO ligas (nombre, temporada_actual, descripcion, activa) VALUES (?, ?, ?, ?)`,
        [
          leagueName(category),
          "2026",
          `Torneo ida y vuelta de categoria ${category.name}. Actualmente transitando la fecha 7.`,
          1,
        ],
      );
      totalLeagues += 1;

      const teamIds = [];

      for (const club of clubs) {
        const coach = coachFor(club, categoryIndex);
        const idEntrenador = await insertAndGetId(
          conn,
          `INSERT INTO entrenadores (nombre, apellido) VALUES (?, ?)`,
          [coach.nombre, `${coach.apellido} ${category.name}`],
        );

        const idEquipo = await insertAndGetId(
          conn,
          `INSERT INTO equipos (nombre, categoria, id_entrenador, descripcion, escudo_url, activo, id_liga) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            teamName(club, category),
            category.name,
            idEntrenador,
            club.description,
            club.shieldUrl,
            1,
            idLiga,
          ],
        );
        totalTeams += 1;
        teamIds.push({ id: idEquipo, club });

        for (let playerIndex = 0; playerIndex < 12; playerIndex += 1) {
          await conn.execute(
            `INSERT INTO jugadores (nombre, apellido, categoria, id_equipo) VALUES (?, ?, ?, ?)`,
            [
              firstNames[(playerIndex + categoryIndex) % firstNames.length],
              lastNames[(playerIndex + clubs.indexOf(club)) % lastNames.length],
              category.playerCategory,
              idEquipo,
            ],
          );
          totalPlayers += 1;
        }
      }

      const firstLeg = roundRobinRound(teamIds.map((team) => team.id));
      const secondLeg = firstLeg.map((round) => round.map(([home, away]) => [away, home]));
      const fullSchedule = [...firstLeg, ...secondLeg];

      for (const [roundIndex, round] of fullSchedule.entries()) {
        for (const [matchIndex, [homeId, awayId]] of round.entries()) {
          const isPlayed = roundIndex < 7;
          const [homeScore, awayScore] = makeScore(roundIndex, matchIndex, categoryIndex, roundIndex >= firstLeg.length ? 1 : 0);

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
              id_liga
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              homeId,
              awayId,
              makeDate(roundIndex),
              makeTime(matchIndex),
              `Estadio ${clubs[(matchIndex + categoryIndex) % clubs.length].short}`,
              isPlayed ? homeScore : null,
              isPlayed ? awayScore : null,
              isPlayed ? "jugado" : "programado",
              idLiga,
            ],
          );

          totalMatches += 1;
          if (isPlayed) playedMatches += 1;
          else scheduledMatches += 1;
        }
      }
    }

    await conn.commit();

    console.log(JSON.stringify({
      ok: true,
      leagues: totalLeagues,
      teams: totalTeams,
      players: totalPlayers,
      matches: totalMatches,
      playedMatches,
      scheduledMatches,
      categories: categories.map((category) => category.name),
      firstClub: clubs[0].name,
    }, null, 2));
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
