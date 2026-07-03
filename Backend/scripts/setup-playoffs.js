const pool = require("../src/config/db");

const columnExists = async (tableName, columnName) => {
  const [rows] = await pool.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );

  return rows.length > 0;
};

const indexExists = async (tableName, indexName) => {
  const [rows] = await pool.query(
    `
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    `,
    [tableName, indexName],
  );

  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (await columnExists(tableName, columnName)) {
    console.log(`OK ${tableName}.${columnName} ya existe`);
    return;
  }

  await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  console.log(`ADD ${tableName}.${columnName}`);
};

const addIndexIfMissing = async (tableName, indexName, definition) => {
  if (await indexExists(tableName, indexName)) {
    console.log(`OK indice ${indexName} ya existe`);
    return;
  }

  await pool.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} ${definition}`);
  console.log(`ADD indice ${indexName}`);
};

async function main() {
  await addColumnIfMissing("partidos", "fase", "VARCHAR(20) NOT NULL DEFAULT 'regular'");
  await addColumnIfMissing("partidos", "ronda", "VARCHAR(50) NULL");
  await addColumnIfMissing("partidos", "numero_juego", "INT NULL");
  await addColumnIfMissing("partidos", "id_serie", "INT NULL");
  await addIndexIfMissing("partidos", "idx_partidos_fase", "(fase)");
  await addIndexIfMissing("partidos", "idx_partidos_serie", "(id_serie)");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS playoff_series (
      id_serie INT AUTO_INCREMENT PRIMARY KEY,
      id_liga INT NOT NULL,
      ronda VARCHAR(50) NOT NULL,
      orden INT NOT NULL,
      id_equipo_1 INT NOT NULL,
      id_equipo_2 INT NOT NULL,
      seed_equipo_1 INT NOT NULL,
      seed_equipo_2 INT NOT NULL,
      formato VARCHAR(30) NOT NULL DEFAULT 'partido_unico',
      id_ganador INT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_playoff_series_liga (id_liga),
      INDEX idx_playoff_series_ronda (ronda),
      CONSTRAINT fk_playoff_series_liga FOREIGN KEY (id_liga) REFERENCES ligas(id_liga),
      CONSTRAINT fk_playoff_series_equipo_1 FOREIGN KEY (id_equipo_1) REFERENCES equipos(id_equipo),
      CONSTRAINT fk_playoff_series_equipo_2 FOREIGN KEY (id_equipo_2) REFERENCES equipos(id_equipo),
      CONSTRAINT fk_playoff_series_ganador FOREIGN KEY (id_ganador) REFERENCES equipos(id_equipo)
    )
  `);

  console.log("OK playoff_series lista");
}

main()
  .catch((error) => {
    console.error("Error preparando playoffs:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
