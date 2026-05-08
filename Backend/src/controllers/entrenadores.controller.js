const pool = require("../config/db");

const getEntrenadores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_entrenador,
        nombre,
        apellido
      FROM entrenadores
      ORDER BY apellido ASC, nombre ASC
    `);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo entrenadores:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo entrenadores",
      error: error.message,
    });
  }
};

const getEntrenadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        id_entrenador,
        nombre,
        apellido
      FROM entrenadores
      WHERE id_entrenador = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Entrenador no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo entrenador:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo entrenador",
      error: error.message,
    });
  }
};

const postEntrenador = async (req, res) => {
  try {
    const { nombre, apellido } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({
        ok: false,
        message: "Nombre y apellido son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO entrenadores (nombre, apellido)
      VALUES (?, ?)
      `,
      [nombre, apellido],
    );

    const [nuevoEntrenador] = await pool.query(
      `
      SELECT
        id_entrenador,
        nombre,
        apellido
      FROM entrenadores
      WHERE id_entrenador = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Entrenador creado correctamente",
      data: nuevoEntrenador[0],
    });
  } catch (error) {
    console.error("Error creando entrenador:", error);
    res.status(500).json({
      ok: false,
      message: "Error creando entrenador",
      error: error.message,
    });
  }
};

const putEntrenador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({
        ok: false,
        message: "Nombre y apellido son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE entrenadores
      SET nombre = ?, apellido = ?
      WHERE id_entrenador = ?
      `,
      [nombre, apellido, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Entrenador no encontrado",
      });
    }

    const [entrenadorActualizado] = await pool.query(
      `
      SELECT
        id_entrenador,
        nombre,
        apellido
      FROM entrenadores
      WHERE id_entrenador = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Entrenador actualizado correctamente",
      data: entrenadorActualizado[0],
    });
  } catch (error) {
    console.error("Error actualizando entrenador:", error);
    res.status(500).json({
      ok: false,
      message: "Error actualizando entrenador",
      error: error.message,
    });
  }
};

const deleteEntrenador = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM entrenadores
      WHERE id_entrenador = ?
      `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Entrenador no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Entrenador eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando entrenador:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar el entrenador porque esta asociado a un equipo",
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error eliminando entrenador",
      error: error.message,
    });
  }
};

module.exports = {
  getEntrenadores,
  getEntrenadorById,
  postEntrenador,
  putEntrenador,
  deleteEntrenador,
};
