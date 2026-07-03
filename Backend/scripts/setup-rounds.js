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

async function backfillRoundNumbers() {
  const [dates] = await pool.query(`
    SELECT id_liga, fecha
    FROM partidos
    WHERE numero_fecha IS NULL
      AND COALESCE(fase, 'regular') = 'regular'
    GROUP BY id_liga, fecha
    ORDER BY id_liga ASC, fecha ASC
  `);

  const datesByLeague = dates.reduce((accumulator, row) => {
    const idLiga = Number(row.id_liga);
    const leagueDates = accumulator.get(idLiga) || [];
    leagueDates.push(row.fecha);
    accumulator.set(idLiga, leagueDates);
    return accumulator;
  }, new Map());

  for (const [idLiga, leagueDates] of datesByLeague.entries()) {
    for (const [index, fecha] of leagueDates.entries()) {
      await pool.query(
        `
        UPDATE partidos
        SET numero_fecha = ?
        WHERE id_liga = ?
          AND fecha = ?
          AND numero_fecha IS NULL
          AND COALESCE(fase, 'regular') = 'regular'
        `,
        [index + 1, idLiga, fecha],
      );
    }
  }

  console.log(`OK backfill de numero_fecha para ${datesByLeague.size} ligas`);
}

async function main() {
  await addColumnIfMissing("partidos", "numero_fecha", "INT NULL");
  await addIndexIfMissing("partidos", "idx_partidos_numero_fecha", "(id_liga, numero_fecha)");
  await backfillRoundNumbers();
}

main()
  .catch((error) => {
    console.error("Error preparando numero de fecha:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
