const pool = require("../src/config/db");

const U17_LEAGUE_NAME = "Liga Metropolitana de Basket - U17";

function buildScore(match) {
  const round = Number(match.numero_fecha || 1);
  const homeSeed = Number(match.id_equipo_local) % 9;
  const awaySeed = Number(match.id_equipo_visitante) % 7;
  let home = 58 + ((round * 5 + homeSeed * 3 + Number(match.id_partido)) % 34);
  let away = 54 + ((round * 4 + awaySeed * 5 + Number(match.id_partido)) % 31);

  if (home === away) {
    home += round % 2 === 0 ? 2 : -2;
  }

  if (home < 45) home = 45;
  if (away < 45) away = 45;

  return { home, away };
}

async function main() {
  const [[league]] = await pool.query(
    `
    SELECT id_liga
    FROM ligas
    WHERE nombre = ?
    LIMIT 1
    `,
    [U17_LEAGUE_NAME],
  );

  if (!league) {
    throw new Error("No se encontro la liga U17");
  }

  const [matches] = await pool.query(
    `
    SELECT id_partido, id_equipo_local, id_equipo_visitante, numero_fecha
    FROM partidos
    WHERE id_liga = ?
      AND COALESCE(fase, 'regular') = 'regular'
      AND (resultado_local IS NULL OR resultado_visitante IS NULL)
    ORDER BY numero_fecha ASC, horario ASC, id_partido ASC
    `,
    [league.id_liga],
  );

  for (const match of matches) {
    const score = buildScore(match);
    await pool.query(
      `
      UPDATE partidos
      SET resultado_local = ?, resultado_visitante = ?, estado = 'jugado'
      WHERE id_partido = ?
      `,
      [score.home, score.away, match.id_partido],
    );
  }

  const [ties] = await pool.query(
    `
    SELECT id_partido, resultado_local
    FROM partidos
    WHERE id_liga = ?
      AND COALESCE(fase, 'regular') = 'regular'
      AND resultado_local = resultado_visitante
    `,
    [league.id_liga],
  );

  for (const tie of ties) {
    await pool.query(
      `
      UPDATE partidos
      SET resultado_local = ?
      WHERE id_partido = ?
      `,
      [Number(tie.resultado_local) + 1, tie.id_partido],
    );
  }

  console.log(`OK U17: ${matches.length} partidos regulares completados, ${ties.length} empates corregidos`);
}

main()
  .catch((error) => {
    console.error("Error completando U17:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
