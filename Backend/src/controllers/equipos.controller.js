const pool = require("../config/db");

const getEquipos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.id_equipo,
        e.nombre,
        e.categoria,
        e.id_liga,
        l.nombre AS liga_nombre,
        e.id_entrenador,
        en.nombre AS entrenador_nombre,
        en.apellido AS entrenador_apellido,
        e.descripcion,
        e.escudo_url,
        e.activo
      FROM equipos e
      LEFT JOIN ligas l ON e.id_liga = l.id_liga
      LEFT JOIN entrenadores en ON e.id_entrenador = en.id_entrenador
      ORDER BY e.nombre ASC
    `);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo equipos:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo equipos",
      error: error.message,
    });
  }
};

const getEquipoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        e.id_equipo,
        e.nombre,
        e.categoria,
        e.id_liga,
        l.nombre AS liga_nombre,
        e.id_entrenador,
        en.nombre AS entrenador_nombre,
        en.apellido AS entrenador_apellido,
        e.descripcion,
        e.escudo_url,
        e.activo
      FROM equipos e
      LEFT JOIN ligas l ON e.id_liga = l.id_liga
      LEFT JOIN entrenadores en ON e.id_entrenador = en.id_entrenador
      WHERE e.id_equipo = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Equipo no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo equipo:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo equipo",
      error: error.message,
    });
  }
};

const postEquipo = async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      id_liga,
      id_entrenador,
      descripcion,
      escudo_url,
      activo,
    } = req.body;

    if (!nombre || !categoria || !id_liga) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, categoria e id_liga son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO equipos (nombre, categoria, id_liga, id_entrenador, descripcion, escudo_url, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        categoria,
        id_liga,
        id_entrenador || null,
        descripcion || null,
        escudo_url || null,
        activo === undefined ? true : activo,
      ],
    );

    const [nuevoEquipo] = await pool.query(
      `
      SELECT
        id_equipo,
        nombre,
        categoria,
        id_liga,
        id_entrenador,
        descripcion,
        escudo_url,
        activo
      FROM equipos
      WHERE id_equipo = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Equipo creado correctamente",
      data: nuevoEquipo[0],
    });
  } catch (error) {
    console.error("Error creando equipo:", error);
    res.status(500).json({
      ok: false,
      message: "Error creando equipo",
      error: error.message,
    });
  }
};

const putEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      categoria,
      id_liga,
      id_entrenador,
      descripcion,
      escudo_url,
      activo,
    } = req.body;

    if (!nombre || !categoria || !id_liga) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, categoria e id_liga son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE equipos
      SET
        nombre = ?,
        categoria = ?,
        id_liga = ?,
        id_entrenador = ?,
        descripcion = ?,
        escudo_url = ?,
        activo = ?
      WHERE id_equipo = ?
      `,
      [
        nombre,
        categoria,
        id_liga,
        id_entrenador || null,
        descripcion || null,
        escudo_url || null,
        activo === undefined ? true : activo,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Equipo no encontrado",
      });
    }

    const [equipoActualizado] = await pool.query(
      `
      SELECT
        id_equipo,
        nombre,
        categoria,
        id_liga,
        id_entrenador,
        descripcion,
        escudo_url,
        activo
      FROM equipos
      WHERE id_equipo = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Equipo actualizado correctamente",
      data: equipoActualizado[0],
    });
  } catch (error) {
    console.error("Error actualizando equipo:", error);
    res.status(500).json({
      ok: false,
      message: "Error actualizando equipo",
      error: error.message,
    });
  }
};

const deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM equipos
      WHERE id_equipo = ?
      `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Equipo no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Equipo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando equipo:", error);
    res.status(500).json({
      ok: false,
      message: "Error eliminando equipo",
      error: error.message,
    });
  }
};

module.exports = {
  getEquipos,
  getEquipoById,
  postEquipo,
  putEquipo,
  deleteEquipo,
};
