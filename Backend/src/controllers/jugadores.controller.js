const pool = require("../config/db");

const getJugadores = async (req, res) => {
  try {
    const { id_equipo } = req.query;

    let query = `
      SELECT
        j.id_jugador,
        j.nombre,
        j.apellido,
        j.categoria,
        j.id_equipo,
        e.nombre AS equipo_nombre
      FROM jugadores j
      LEFT JOIN equipos e ON j.id_equipo = e.id_equipo
    `;

    const params = [];

    if (id_equipo) {
      query += " WHERE j.id_equipo = ?";
      params.push(id_equipo);
    }

    query += " ORDER BY j.apellido ASC, j.nombre ASC";

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo jugadores:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo jugadores",
      error: error.message,
    });
  }
};

const getJugadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        j.id_jugador,
        j.nombre,
        j.apellido,
        j.categoria,
        j.id_equipo,
        e.nombre AS equipo_nombre
      FROM jugadores j
      LEFT JOIN equipos e ON j.id_equipo = e.id_equipo
      WHERE j.id_jugador = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Jugador no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo jugador:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo jugador",
      error: error.message,
    });
  }
};

const postJugador = async (req, res) => {
  try {
    const { nombre, apellido, categoria, id_equipo } = req.body;

    if (!nombre || !apellido || !categoria || !id_equipo) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, apellido, categoria e id_equipo son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO jugadores (nombre, apellido, categoria, id_equipo)
      VALUES (?, ?, ?, ?)
      `,
      [nombre, apellido, categoria, id_equipo],
    );

    const [nuevoJugador] = await pool.query(
      `
      SELECT
        id_jugador,
        nombre,
        apellido,
        categoria,
        id_equipo
      FROM jugadores
      WHERE id_jugador = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Jugador creado correctamente",
      data: nuevoJugador[0],
    });
  } catch (error) {
    console.error("Error creando jugador:", error);
    res.status(500).json({
      ok: false,
      message: "Error creando jugador",
      error: error.message,
    });
  }
};

const putJugador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, categoria, id_equipo } = req.body;

    if (!nombre || !apellido || !categoria || !id_equipo) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, apellido, categoria e id_equipo son obligatorios",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE jugadores
      SET nombre = ?, apellido = ?, categoria = ?, id_equipo = ?
      WHERE id_jugador = ?
      `,
      [nombre, apellido, categoria, id_equipo, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Jugador no encontrado",
      });
    }

    const [jugadorActualizado] = await pool.query(
      `
      SELECT
        id_jugador,
        nombre,
        apellido,
        categoria,
        id_equipo
      FROM jugadores
      WHERE id_jugador = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Jugador actualizado correctamente",
      data: jugadorActualizado[0],
    });
  } catch (error) {
    console.error("Error actualizando jugador:", error);
    res.status(500).json({
      ok: false,
      message: "Error actualizando jugador",
      error: error.message,
    });
  }
};

const deleteJugador = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM jugadores
      WHERE id_jugador = ?
      `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Jugador no encontrado",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Jugador eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando jugador:", error);
    res.status(500).json({
      ok: false,
      message: "Error eliminando jugador",
      error: error.message,
    });
  }
};

module.exports = {
  getJugadores,
  getJugadorById,
  postJugador,
  putJugador,
  deleteJugador,
};
