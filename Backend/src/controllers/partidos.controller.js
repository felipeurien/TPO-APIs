const pool = require("../config/db");

const normalizarEstadoPartido = (estado) => {
  if (estado === "finalizado") {
    return "jugado";
  }

  return estado || "programado";
};

const esEnteroNoNegativo = (valor) => {
  if (valor === "" || valor === null || valor === undefined) {
    return false;
  }

  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0;
};

const validarResultadoCompleto = (resultadoLocal, resultadoVisitante, obligatorio = false) => {
  const tieneLocal = resultadoLocal !== undefined && resultadoLocal !== null;
  const tieneVisitante = resultadoVisitante !== undefined && resultadoVisitante !== null;

  if (!obligatorio && !tieneLocal && !tieneVisitante) {
    return null;
  }

  if (!tieneLocal || !tieneVisitante) {
    return "Resultado local y resultado visitante deben cargarse juntos";
  }

  if (!esEnteroNoNegativo(resultadoLocal) || !esEnteroNoNegativo(resultadoVisitante)) {
    return "Los resultados deben ser numeros enteros no negativos";
  }

  return null;
};

const existeLiga = async (idLiga) => {
  const [ligas] = await pool.query(
    `
    SELECT id_liga
    FROM ligas
    WHERE id_liga = ?
    LIMIT 1
    `,
    [idLiga],
  );

  return ligas.length > 0;
};

const validarEquiposPartido = async (idEquipoLocal, idEquipoVisitante, idLiga) => {
  if (Number(idEquipoLocal) === Number(idEquipoVisitante)) {
    return "El equipo local y el equipo visitante no pueden ser el mismo";
  }

  const ligaExiste = await existeLiga(idLiga);

  if (!ligaExiste) {
    return "La liga indicada no existe";
  }

  const [equipos] = await pool.query(
    `
    SELECT id_equipo
    FROM equipos
    WHERE id_equipo IN (?, ?)
      AND id_liga = ?
    `,
    [idEquipoLocal, idEquipoVisitante, idLiga],
  );

  if (equipos.length < 2) {
    return "El equipo local y el equipo visitante deben existir y pertenecer a la liga indicada";
  }

  return null;
};

const getPartidos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id_partido,
        p.id_liga,
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
      ORDER BY p.fecha ASC, p.horario ASC
    `);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo partidos:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo partidos",
      error: error.message,
    });
  }
};

const getPartidoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        p.id_partido,
        p.id_liga,
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
      WHERE p.id_partido = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Partido no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo partido:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo partido",
      error: error.message,
    });
  }
};

const postPartido = async (req, res) => {
  try {
    const {
      id_equipo_local,
      id_equipo_visitante,
      id_liga,
      fecha,
      horario,
      lugar,
      resultado_local,
      resultado_visitante,
      estado,
    } = req.body;

    if (!id_equipo_local || !id_equipo_visitante || !id_liga || !fecha || !horario || !lugar) {
      return res.status(400).json({
        ok: false,
        message: "Equipo local, equipo visitante, liga, fecha, horario y lugar son obligatorios",
      });
    }

    const errorEquipos = await validarEquiposPartido(id_equipo_local, id_equipo_visitante, id_liga);

    if (errorEquipos) {
      return res.status(400).json({
        ok: false,
        message: errorEquipos,
      });
    }

    const errorResultado = validarResultadoCompleto(resultado_local, resultado_visitante);

    if (errorResultado) {
      return res.status(400).json({
        ok: false,
        message: errorResultado,
      });
    }

    const [result] = await pool.query(
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
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_equipo_local,
        id_equipo_visitante,
        id_liga,
        fecha,
        horario,
        lugar,
        resultado_local ?? null,
        resultado_visitante ?? null,
        normalizarEstadoPartido(estado),
      ],
    );

    const [nuevoPartido] = await pool.query(
      `
      SELECT
        id_partido,
        id_liga,
        id_equipo_local,
        id_equipo_visitante,
        fecha,
        horario,
        lugar,
        resultado_local,
        resultado_visitante,
        estado
      FROM partidos
      WHERE id_partido = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Partido creado correctamente",
      data: nuevoPartido[0],
    });
  } catch (error) {
    console.error("Error creando partido:", error);
    res.status(500).json({
      ok: false,
      message: "Error creando partido",
      error: error.message,
    });
  }
};

const putPartido = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_equipo_local,
      id_equipo_visitante,
      id_liga,
      fecha,
      horario,
      lugar,
      resultado_local,
      resultado_visitante,
      estado,
    } = req.body;

    if (!id_equipo_local || !id_equipo_visitante || !id_liga || !fecha || !horario || !lugar) {
      return res.status(400).json({
        ok: false,
        message: "Equipo local, equipo visitante, liga, fecha, horario y lugar son obligatorios",
      });
    }

    const errorEquipos = await validarEquiposPartido(id_equipo_local, id_equipo_visitante, id_liga);

    if (errorEquipos) {
      return res.status(400).json({
        ok: false,
        message: errorEquipos,
      });
    }

    const errorResultado = validarResultadoCompleto(resultado_local, resultado_visitante);

    if (errorResultado) {
      return res.status(400).json({
        ok: false,
        message: errorResultado,
      });
    }

    const [result] = await pool.query(
      `
      UPDATE partidos
      SET
        id_equipo_local = ?,
        id_equipo_visitante = ?,
        id_liga = ?,
        fecha = ?,
        horario = ?,
        lugar = ?,
        resultado_local = ?,
        resultado_visitante = ?,
        estado = ?
      WHERE id_partido = ?
      `,
      [
        id_equipo_local,
        id_equipo_visitante,
        id_liga,
        fecha,
        horario,
        lugar,
        resultado_local ?? null,
        resultado_visitante ?? null,
        normalizarEstadoPartido(estado),
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Partido no encontrado",
      });
    }

    const [partidoActualizado] = await pool.query(
      `
      SELECT
        id_partido,
        id_liga,
        id_equipo_local,
        id_equipo_visitante,
        fecha,
        horario,
        lugar,
        resultado_local,
        resultado_visitante,
        estado
      FROM partidos
      WHERE id_partido = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Partido actualizado correctamente",
      data: partidoActualizado[0],
    });
  } catch (error) {
    console.error("Error actualizando partido:", error);
    res.status(500).json({
      ok: false,
      message: "Error actualizando partido",
      error: error.message,
    });
  }
};

const patchResultadoPartido = async (req, res) => {
  try {
    const { id } = req.params;
    const { resultado_local, resultado_visitante } = req.body;

    if (resultado_local === undefined || resultado_visitante === undefined) {
      return res.status(400).json({
        ok: false,
        message: "Resultado local y resultado visitante son obligatorios",
      });
    }

    const errorResultado = validarResultadoCompleto(resultado_local, resultado_visitante, true);

    if (errorResultado) {
      return res.status(400).json({
        ok: false,
        message: errorResultado,
      });
    }

    const [result] = await pool.query(
      `
      UPDATE partidos
      SET resultado_local = ?, resultado_visitante = ?, estado = ?
      WHERE id_partido = ?
      `,
      [resultado_local, resultado_visitante, "jugado", id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Partido no encontrado",
      });
    }

    const [partidoActualizado] = await pool.query(
      `
      SELECT
        id_partido,
        id_liga,
        id_equipo_local,
        id_equipo_visitante,
        fecha,
        horario,
        lugar,
        resultado_local,
        resultado_visitante,
        estado
      FROM partidos
      WHERE id_partido = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Resultado cargado correctamente",
      data: partidoActualizado[0],
    });
  } catch (error) {
    console.error("Error cargando resultado:", error);
    res.status(500).json({
      ok: false,
      message: "Error cargando resultado",
      error: error.message,
    });
  }
};

const deletePartido = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM partidos
      WHERE id_partido = ?
      `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Partido no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Partido eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando partido:", error);
    res.status(500).json({
      ok: false,
      message: "Error eliminando partido",
      error: error.message,
    });
  }
};

module.exports = {
  getPartidos,
  getPartidoById,
  postPartido,
  putPartido,
  patchResultadoPartido,
  deletePartido,
};
