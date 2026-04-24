const pool = require("../config/db");

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

module.exports = {
  getAdministradores,
};
