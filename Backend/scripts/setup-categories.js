const pool = require("../src/config/db");

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id_categoria INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(80) NOT NULL UNIQUE,
      descripcion VARCHAR(255) NULL,
      activa TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT IGNORE INTO categorias (nombre)
    SELECT DISTINCT categoria
    FROM equipos
    WHERE categoria IS NOT NULL AND categoria <> ''
  `);

  await pool.query(`
    INSERT IGNORE INTO categorias (nombre)
    SELECT DISTINCT categoria
    FROM jugadores
    WHERE categoria IS NOT NULL AND categoria <> ''
  `);

  await pool.query(`
    INSERT IGNORE INTO categorias (nombre)
    SELECT DISTINCT TRIM(SUBSTRING_INDEX(nombre, ' - ', -1))
    FROM ligas
    WHERE nombre LIKE '% - %'
      AND TRIM(SUBSTRING_INDEX(nombre, ' - ', -1)) <> ''
  `);

  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM categorias");
  console.log(`OK categorias listas: ${rows[0].total}`);
}

main()
  .catch((error) => {
    console.error("Error preparando categorias:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
