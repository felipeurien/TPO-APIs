const pool = require("../config/db");

const PLAYOFF_ROUNDS = {
  SEMIFINAL: "semifinal",
  FINAL: "final",
};

const PLAYOFF_PHASE = "playoff";
const REGULAR_PHASE = "regular";

const ligaSelectFields = `
  l.id_liga,
  l.nombre,
  l.temporada_actual,
  l.descripcion,
  l.activa,
  COALESCE(
    (
      SELECT MIN(p.numero_fecha)
      FROM partidos p
      WHERE p.id_liga = l.id_liga
        AND p.fase = 'regular'
        AND p.numero_fecha IS NOT NULL
        AND NOT (
          p.estado IN ('jugado', 'finalizado')
          OR (p.resultado_local IS NOT NULL AND p.resultado_visitante IS NOT NULL)
        )
    ),
    (
      SELECT MAX(p.numero_fecha)
      FROM partidos p
      WHERE p.id_liga = l.id_liga
        AND p.fase = 'regular'
        AND p.numero_fecha IS NOT NULL
    )
  ) AS fecha_actual
`;

const ensureLigaExists = async (id) => {
  const [liga] = await pool.query(
    `
    SELECT id_liga
    FROM ligas
    WHERE id_liga = ?
    `,
    [id],
  );

  return liga.length > 0;
};

const mapClasificacionRow = (equipo) => {
  const ganados = Number(equipo.ganados);
  const empatados = Number(equipo.empatados);
  const perdidos = Number(equipo.perdidos);
  const puntosFavor = Number(equipo.puntos_favor);
  const puntosContra = Number(equipo.puntos_contra);

  return {
    id_equipo: equipo.id_equipo,
    nombre: equipo.nombre,
    categoria: equipo.categoria,
    partidos_jugados: Number(equipo.partidos_jugados),
    ganados,
    empatados,
    perdidos,
    puntos_favor: puntosFavor,
    puntos_contra: puntosContra,
    diferencia: puntosFavor - puntosContra,
    puntos: ganados * 3 + empatados,
  };
};

const buildClasificacionLiga = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT
      e.id_equipo,
      e.nombre,
      e.categoria,
      COUNT(p.id_partido) AS partidos_jugados,
      COALESCE(SUM(
        CASE
          WHEN p.id_equipo_local = e.id_equipo
            AND p.resultado_local > p.resultado_visitante THEN 1
          WHEN p.id_equipo_visitante = e.id_equipo
            AND p.resultado_visitante > p.resultado_local THEN 1
          ELSE 0
        END
      ), 0) AS ganados,
      COALESCE(SUM(
        CASE
          WHEN p.resultado_local = p.resultado_visitante THEN 1
          ELSE 0
        END
      ), 0) AS empatados,
      COALESCE(SUM(
        CASE
          WHEN p.id_equipo_local = e.id_equipo
            AND p.resultado_local < p.resultado_visitante THEN 1
          WHEN p.id_equipo_visitante = e.id_equipo
            AND p.resultado_visitante < p.resultado_local THEN 1
          ELSE 0
        END
      ), 0) AS perdidos,
      COALESCE(SUM(
        CASE
          WHEN p.id_equipo_local = e.id_equipo THEN p.resultado_local
          WHEN p.id_equipo_visitante = e.id_equipo THEN p.resultado_visitante
          ELSE 0
        END
      ), 0) AS puntos_favor,
      COALESCE(SUM(
        CASE
          WHEN p.id_equipo_local = e.id_equipo THEN p.resultado_visitante
          WHEN p.id_equipo_visitante = e.id_equipo THEN p.resultado_local
          ELSE 0
        END
      ), 0) AS puntos_contra
    FROM equipos e
    LEFT JOIN partidos p
      ON p.resultado_local IS NOT NULL
      AND p.resultado_visitante IS NOT NULL
      AND p.fase = ?
      AND (
        p.id_equipo_local = e.id_equipo
        OR p.id_equipo_visitante = e.id_equipo
      )
    WHERE e.id_liga = ?
    GROUP BY e.id_equipo, e.nombre, e.categoria
    ORDER BY (ganados * 3 + empatados) DESC, puntos_favor - puntos_contra DESC, puntos_favor DESC, e.nombre ASC
    `,
    [REGULAR_PHASE, id],
  );

  return rows.map(mapClasificacionRow);
};

const getWinnerFromMatch = (partido) => {
  if (
    partido.resultado_local === null ||
    partido.resultado_local === undefined ||
    partido.resultado_visitante === null ||
    partido.resultado_visitante === undefined ||
    Number(partido.resultado_local) === Number(partido.resultado_visitante)
  ) {
    return null;
  }

  return Number(partido.resultado_local) > Number(partido.resultado_visitante)
    ? partido.id_equipo_local
    : partido.id_equipo_visitante;
};

const buildPlayoffPayload = async (idLiga) => {
  const [series] = await pool.query(
    `
    SELECT
      s.id_serie,
      s.id_liga,
      s.ronda,
      s.orden,
      s.id_equipo_1,
      s.id_equipo_2,
      s.seed_equipo_1,
      s.seed_equipo_2,
      s.formato,
      s.id_ganador,
      s.estado,
      e1.nombre AS equipo_1,
      e2.nombre AS equipo_2,
      ganador.nombre AS ganador
    FROM playoff_series s
    INNER JOIN equipos e1 ON s.id_equipo_1 = e1.id_equipo
    INNER JOIN equipos e2 ON s.id_equipo_2 = e2.id_equipo
    LEFT JOIN equipos ganador ON s.id_ganador = ganador.id_equipo
    WHERE s.id_liga = ?
    ORDER BY FIELD(s.ronda, 'semifinal', 'final'), s.orden ASC
    `,
    [idLiga],
  );

  const [partidos] = await pool.query(
    `
    SELECT
      p.id_partido,
      p.id_liga,
      p.id_serie,
      p.fase,
      p.ronda,
      p.numero_juego,
      p.id_equipo_local,
      local.nombre AS equipo_local,
      p.id_equipo_visitante,
      visitante.nombre AS equipo_visitante,
      p.fecha,
      p.horario,
      p.lugar,
      p.resultado_local,
      p.resultado_visitante,
      p.estado
    FROM partidos p
    INNER JOIN equipos local ON p.id_equipo_local = local.id_equipo
    INNER JOIN equipos visitante ON p.id_equipo_visitante = visitante.id_equipo
    WHERE p.id_liga = ?
      AND p.fase = ?
    ORDER BY FIELD(p.ronda, 'semifinal', 'final'), p.numero_juego ASC, p.fecha ASC, p.horario ASC
    `,
    [idLiga, PLAYOFF_PHASE],
  );

  const partidosPorSerie = partidos.reduce((acc, partido) => {
    const key = Number(partido.id_serie);
    acc.set(key, [...(acc.get(key) || []), partido]);
    return acc;
  }, new Map());

  return series.map((serie) => ({
    ...serie,
    partidos: partidosPorSerie.get(Number(serie.id_serie)) || [],
  }));
};

const insertPlayoffSeries = async ({ idLiga, ronda, orden, equipo1, equipo2, seed1, seed2 }) => {
  const [result] = await pool.query(
    `
    INSERT INTO playoff_series (
      id_liga,
      ronda,
      orden,
      id_equipo_1,
      id_equipo_2,
      seed_equipo_1,
      seed_equipo_2,
      formato,
      estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'partido_unico', 'pendiente')
    `,
    [idLiga, ronda, orden, equipo1.id_equipo, equipo2.id_equipo, seed1, seed2],
  );

  return result.insertId;
};

const insertPlayoffMatch = async ({ idLiga, idSerie, ronda, orden, local, visitante, fecha, horario }) => {
  await pool.query(
    `
    INSERT INTO partidos (
      id_equipo_local,
      id_equipo_visitante,
      id_liga,
      fecha,
      horario,
      lugar,
      resultado_local,
      resultado_visitante,
      estado,
      fase,
      ronda,
      numero_juego,
      id_serie
    )
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 'programado', ?, ?, ?, ?)
    `,
    [
      local.id_equipo,
      visitante.id_equipo,
      idLiga,
      fecha,
      horario,
      `Sede ${local.nombre}`,
      PLAYOFF_PHASE,
      ronda,
      orden,
      idSerie,
    ],
  );
};

const getNextPlayoffDate = async (idLiga, daysToAdd = 7) => {
  const [rows] = await pool.query(
    `
    SELECT DATE_ADD(COALESCE(MAX(fecha), CURDATE()), INTERVAL ? DAY) AS fecha
    FROM partidos
    WHERE id_liga = ?
    `,
    [daysToAdd, idLiga],
  );

  return rows[0]?.fecha;
};

const getLigas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ${ligaSelectFields}
      FROM ligas l
      ORDER BY l.id_liga ASC
    `);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo ligas:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo ligas",
      error: error.message,
    });
  }
};

const getLigaById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        ${ligaSelectFields}
      FROM ligas l
      WHERE l.id_liga = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    res.status(200).json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo liga por id:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo liga",
      error: error.message,
    });
  }
};

const getClasificacionLiga = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await ensureLigaExists(id))) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    const clasificacion = await buildClasificacionLiga(id);

    res.status(200).json({
      ok: true,
      cantidad: clasificacion.length,
      data: clasificacion,
    });
  } catch (error) {
    console.error("Error obteniendo clasificacion:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo clasificacion",
      error: error.message,
    });
  }
};

const getPlayoffsLiga = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await ensureLigaExists(id))) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    const clasificados = (await buildClasificacionLiga(id)).slice(0, 4);
    const series = await buildPlayoffPayload(id);

    res.status(200).json({
      ok: true,
      data: {
        formato: "partido_unico",
        regla: "1 vs 4 y 2 vs 3. El mejor clasificado juega de local.",
        clasificados,
        series,
      },
    });
  } catch (error) {
    console.error("Error obteniendo playoffs:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo playoffs",
      error: error.message,
    });
  }
};

const postGenerarPlayoffsLiga = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await ensureLigaExists(id))) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    const [existentes] = await pool.query(
      `
      SELECT id_serie
      FROM playoff_series
      WHERE id_liga = ?
      LIMIT 1
      `,
      [id],
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "La liga ya tiene playoffs generados",
      });
    }

    const clasificados = (await buildClasificacionLiga(id)).slice(0, 4);

    if (clasificados.length < 4) {
      return res.status(400).json({
        ok: false,
        message: "Se necesitan al menos 4 equipos en la clasificacion para generar playoffs",
      });
    }

    const semiDate = await getNextPlayoffDate(id, 7);
    const semi1 = await insertPlayoffSeries({
      idLiga: id,
      ronda: PLAYOFF_ROUNDS.SEMIFINAL,
      orden: 1,
      equipo1: clasificados[0],
      equipo2: clasificados[3],
      seed1: 1,
      seed2: 4,
    });
    const semi2 = await insertPlayoffSeries({
      idLiga: id,
      ronda: PLAYOFF_ROUNDS.SEMIFINAL,
      orden: 2,
      equipo1: clasificados[1],
      equipo2: clasificados[2],
      seed1: 2,
      seed2: 3,
    });

    await insertPlayoffMatch({
      idLiga: id,
      idSerie: semi1,
      ronda: PLAYOFF_ROUNDS.SEMIFINAL,
      orden: 1,
      local: clasificados[0],
      visitante: clasificados[3],
      fecha: semiDate,
      horario: "20:00:00",
    });
    await insertPlayoffMatch({
      idLiga: id,
      idSerie: semi2,
      ronda: PLAYOFF_ROUNDS.SEMIFINAL,
      orden: 2,
      local: clasificados[1],
      visitante: clasificados[2],
      fecha: semiDate,
      horario: "21:30:00",
    });

    res.status(201).json({
      ok: true,
      message: "Playoffs generados correctamente",
      data: {
        clasificados,
        series: await buildPlayoffPayload(id),
      },
    });
  } catch (error) {
    console.error("Error generando playoffs:", error);
    res.status(500).json({
      ok: false,
      message: "Error generando playoffs",
      error: error.message,
    });
  }
};

const postActualizarPlayoffsLiga = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await ensureLigaExists(id))) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    const [series] = await pool.query(
      `
      SELECT *
      FROM playoff_series
      WHERE id_liga = ?
      ORDER BY FIELD(ronda, 'semifinal', 'final'), orden ASC
      `,
      [id],
    );

    if (series.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "La liga todavia no tiene playoffs generados",
      });
    }

    const [partidos] = await pool.query(
      `
      SELECT *
      FROM partidos
      WHERE id_liga = ?
        AND fase = ?
      `,
      [id, PLAYOFF_PHASE],
    );

    for (const serie of series) {
      const partido = partidos.find((item) => Number(item.id_serie) === Number(serie.id_serie));
      const idGanador = partido ? getWinnerFromMatch(partido) : null;

      if (idGanador && Number(serie.id_ganador) !== Number(idGanador)) {
        await pool.query(
          `
          UPDATE playoff_series
          SET id_ganador = ?, estado = 'finalizada'
          WHERE id_serie = ?
          `,
          [idGanador, serie.id_serie],
        );
      }
    }

    const [updatedSemis] = await pool.query(
      `
      SELECT *
      FROM playoff_series
      WHERE id_liga = ?
        AND ronda = ?
      ORDER BY orden ASC
      `,
      [id, PLAYOFF_ROUNDS.SEMIFINAL],
    );

    const [finalExistente] = await pool.query(
      `
      SELECT id_serie
      FROM playoff_series
      WHERE id_liga = ?
        AND ronda = ?
      LIMIT 1
      `,
      [id, PLAYOFF_ROUNDS.FINAL],
    );

    if (
      finalExistente.length === 0 &&
      updatedSemis.length === 2 &&
      updatedSemis.every((serie) => serie.id_ganador)
    ) {
      const [equiposFinal] = await pool.query(
        `
        SELECT id_equipo, nombre
        FROM equipos
        WHERE id_equipo IN (?, ?)
        `,
        [updatedSemis[0].id_ganador, updatedSemis[1].id_ganador],
      );

      const seedByTeam = new Map();
      updatedSemis.forEach((serie) => {
        seedByTeam.set(Number(serie.id_equipo_1), Number(serie.seed_equipo_1));
        seedByTeam.set(Number(serie.id_equipo_2), Number(serie.seed_equipo_2));
      });

      const finalistas = equiposFinal
        .map((equipo) => ({ ...equipo, seed: seedByTeam.get(Number(equipo.id_equipo)) }))
        .sort((a, b) => a.seed - b.seed);

      const finalSerieId = await insertPlayoffSeries({
        idLiga: id,
        ronda: PLAYOFF_ROUNDS.FINAL,
        orden: 1,
        equipo1: finalistas[0],
        equipo2: finalistas[1],
        seed1: finalistas[0].seed,
        seed2: finalistas[1].seed,
      });

      const finalDate = await getNextPlayoffDate(id, 7);
      await insertPlayoffMatch({
        idLiga: id,
        idSerie: finalSerieId,
        ronda: PLAYOFF_ROUNDS.FINAL,
        orden: 1,
        local: finalistas[0],
        visitante: finalistas[1],
        fecha: finalDate,
        horario: "20:30:00",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Playoffs actualizados correctamente",
      data: {
        series: await buildPlayoffPayload(id),
      },
    });
  } catch (error) {
    console.error("Error actualizando playoffs:", error);
    res.status(500).json({
      ok: false,
      message: "Error actualizando playoffs",
      error: error.message,
    });
  }
};

const postLiga = async (req, res) => {
  try {
    const { nombre, temporada_actual, descripcion, activa } = req.body;

    if (!nombre || !temporada_actual) {
      return res.status(400).json({
        ok: false,
        message: "Nombre y temporada_actual son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO ligas (nombre, temporada_actual, descripcion, activa)
      VALUES (?, ?, ?, ?)
      `,
      [nombre, temporada_actual, descripcion ?? null, activa ?? true],
    );

    const [nuevaLiga] = await pool.query(
      `
      SELECT
        ${ligaSelectFields}
      FROM ligas l
      WHERE l.id_liga = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Liga creada correctamente",
      data: nuevaLiga[0],
    });
  } catch (error) {
    console.error("Error creando liga:", error);
    res.status(500).json({
      ok: false,
      message: "Error creando liga",
      error: error.message,
    });
  }
};

const putLiga = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, temporada_actual, descripcion, activa } = req.body;

    if (!nombre || !temporada_actual) {
      return res.status(400).json({
        ok: false,
        message: "Nombre y temporada_actual son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE ligas
      SET
        nombre = ?,
        temporada_actual = ?,
        descripcion = ?,
        activa = ?
      WHERE id_liga = ?
      `,
      [nombre, temporada_actual, descripcion ?? null, activa ?? true, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    const [ligaActualizada] = await pool.query(
      `
      SELECT
        ${ligaSelectFields}
      FROM ligas l
      WHERE l.id_liga = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Liga actualizada correctamente",
      data: ligaActualizada[0],
    });
  } catch (error) {
    console.error("Error actualizando liga:", error);
    res.status(500).json({
      ok: false,
      message: "Error actualizando liga",
      error: error.message,
    });
  }
};

const deleteLiga = async (req, res) => {
  try {
    const { id } = req.params;

    const [equiposAsociados] = await pool.query(
      `
      SELECT id_equipo
      FROM equipos
      WHERE id_liga = ?
      LIMIT 1
      `,
      [id],
    );

    if (equiposAsociados.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar la liga porque tiene equipos asociados",
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM ligas
      WHERE id_liga = ?
      `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Liga no encontrada",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Liga eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando liga:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar la liga porque tiene equipos asociados",
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error eliminando liga",
      error: error.message,
    });
  }
};

module.exports = {
  getLigas,
  getLigaById,
  getClasificacionLiga,
  getPlayoffsLiga,
  postGenerarPlayoffsLiga,
  postActualizarPlayoffsLiga,
  postLiga,
  putLiga,
  deleteLiga,
};
