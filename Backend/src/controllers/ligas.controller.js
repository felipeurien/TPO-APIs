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

module.exports = {
  getLigas,
  getLigaById,
  postLiga,
};
