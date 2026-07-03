const pool = require("../config/db");

const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id_categoria, nombre, descripcion, activa
      FROM categorias
      ORDER BY nombre ASC
    `);

    res.status(200).json({
      ok: true,
      cantidad: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo categorias:", error);
    res.status(500).json({
      ok: false,
      message: "Error obteniendo categorias",
      error: error.message,
    });
  }
};

const postCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, activa } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "Nombre es obligatorio",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO categorias (nombre, descripcion, activa)
      VALUES (?, ?, ?)
      `,
      [nombre.trim(), descripcion ?? null, activa ?? true],
    );

    const [nuevaCategoria] = await pool.query(
      `
      SELECT id_categoria, nombre, descripcion, activa
      FROM categorias
      WHERE id_categoria = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      ok: true,
      message: "Categoria creada correctamente",
      data: nuevaCategoria[0],
    });
  } catch (error) {
    console.error("Error creando categoria:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "La categoria ya existe",
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error creando categoria",
      error: error.message,
    });
  }
};

const putCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activa } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "Nombre es obligatorio",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE categorias
      SET nombre = ?, descripcion = ?, activa = ?
      WHERE id_categoria = ?
      `,
      [nombre.trim(), descripcion ?? null, activa ?? true, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Categoria no encontrada",
      });
    }

    const [categoriaActualizada] = await pool.query(
      `
      SELECT id_categoria, nombre, descripcion, activa
      FROM categorias
      WHERE id_categoria = ?
      `,
      [id],
    );

    res.status(200).json({
      ok: true,
      message: "Categoria actualizada correctamente",
      data: categoriaActualizada[0],
    });
  } catch (error) {
    console.error("Error actualizando categoria:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "La categoria ya existe",
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error actualizando categoria",
      error: error.message,
    });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const [categoria] = await pool.query(
      `
      SELECT nombre
      FROM categorias
      WHERE id_categoria = ?
      `,
      [id],
    );

    if (categoria.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Categoria no encontrada",
      });
    }

    const [usoEquipos] = await pool.query(
      `
      SELECT id_equipo
      FROM equipos
      WHERE categoria = ?
      LIMIT 1
      `,
      [categoria[0].nombre],
    );

    const [usoJugadores] = await pool.query(
      `
      SELECT id_jugador
      FROM jugadores
      WHERE categoria = ?
      LIMIT 1
      `,
      [categoria[0].nombre],
    );

    if (usoEquipos.length > 0 || usoJugadores.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar una categoria en uso por equipos o jugadores",
      });
    }

    await pool.query("DELETE FROM categorias WHERE id_categoria = ?", [id]);

    res.status(200).json({
      ok: true,
      message: "Categoria eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando categoria:", error);
    res.status(500).json({
      ok: false,
      message: "Error eliminando categoria",
      error: error.message,
    });
  }
};

module.exports = {
  getCategorias,
  postCategoria,
  putCategoria,
  deleteCategoria,
};
