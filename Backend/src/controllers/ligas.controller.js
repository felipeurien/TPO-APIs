const pool = require("../config/db");

const getLigas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_liga,
        nombre,
        temporada_actual,
        descripcion,
        activa
      FROM ligas
      ORDER BY id_liga ASC
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
        id_liga,
        nombre,
        temporada_actual,
        descripcion,
        activa
      FROM ligas
      WHERE id_liga = ?
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
        id_liga,
        nombre,
        temporada_actual,
        descripcion,
        activa
      FROM ligas
      WHERE id_liga = ?
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
        id_liga,
        nombre,
        temporada_actual,
        descripcion,
        activa
      FROM ligas
      WHERE id_liga = ?
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
  postLiga,
  putLiga,
  deleteLiga,
};
