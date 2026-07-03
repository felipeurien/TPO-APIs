const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return mysql.escape(value.toISOString().slice(0, 19).replace("T", " "));
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  return mysql.escape(value);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tableKey = `Tables_in_${process.env.DB_NAME}`;
  const lines = [
    `-- Backup ${process.env.DB_NAME}`,
    `-- Created ${new Date().toISOString()}`,
    "SET FOREIGN_KEY_CHECKS=0;",
    "",
  ];

  for (const tableRow of tables) {
    const tableName = tableRow[tableKey];
    const [[createRow]] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);

    lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    lines.push(`${createRow["Create Table"]};`);
    lines.push("");

    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const columnSql = columns.map((column) => `\`${column}\``).join(", ");

      for (const row of rows) {
        const values = columns.map((column) => sqlValue(row[column])).join(", ");
        lines.push(`INSERT INTO \`${tableName}\` (${columnSql}) VALUES (${values});`);
      }
      lines.push("");
    }
  }

  lines.push("SET FOREIGN_KEY_CHECKS=1;");

  const backupDir = path.resolve(__dirname, "../../Backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const filename = `${process.env.DB_NAME}-before-senior-six-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
  const outputPath = path.join(backupDir, filename);
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

  await conn.end();
  console.log(outputPath);
}

main().catch((error) => {
  console.error("Error creando backup:", error);
  process.exitCode = 1;
});
