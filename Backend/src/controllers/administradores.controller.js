const pool = require("../config/db");
const bcrypt = require("bcrypt");

const getAdministradores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_administrador,
        username,
        activo,
        fecha_creacion
      FROM administradores
      ORDER BY id_administrador ASC
    `);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo administradores:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo administradores",
      error: error.message,
    });
  }
};

const postAdministradores = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        message: "Username y password son obligatorios",
      });
    }

    const [adminExistente] = await pool.query(
      "SELECT id_administrador FROM administradores WHERE username = ?",
      [username],
    );

    if (adminExistente.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El username ya existe",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.query(
      `
      INSERT INTO administradores (username, password_hash)
      VALUES (?, ?)
      `,
      [username, passwordHash],
    );

    const [nuevoAdmin] = await pool.query(
      `
      SELECT
        id_administrador,
        username,
        activo,
        fecha_creacion
      FROM administradores
      WHERE id_administrador = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Administrador creado correctamente",
      data: nuevoAdmin[0],
    });
  } catch (error) {
    console.error("Error creando administrador:", error);
    res.status(500).json({
      ok: false,
      message: "Error creando administrador",
      error: error.message,
    });
  }
};

module.exports = {
  getAdministradores,
  postAdministradores,
};
