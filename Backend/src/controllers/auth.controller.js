const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        message: "Username y password son obligatorios",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        id_administrador,
        username,
        password_hash,
        activo,
        fecha_creacion
      FROM administradores
      WHERE username = ?
      LIMIT 1
      `,
      [username],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales invalidas",
      });
    }

    const admin = rows[0];

    if (!admin.activo) {
      return res.status(403).json({
        ok: false,
        message: "El administrador esta inactivo",
      });
    }

    const passwordValida = await bcrypt.compare(password, admin.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales invalidas",
      });
    }

    const token = jwt.sign(
      {
        id_administrador: admin.id_administrador,
        username: admin.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      },
    );

    return res.status(200).json({
      ok: true,
      message: "Login correcto",
      token,
      data: {
        id_administrador: admin.id_administrador,
        username: admin.username,
        activo: admin.activo,
        fecha_creacion: admin.fecha_creacion,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({
      ok: false,
      message: "Error en login",
      error: error.message,
    });
  }
};

module.exports = {
  login,
};
