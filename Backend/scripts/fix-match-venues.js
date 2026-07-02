const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const clubs = [
  { name: "Banfield", short: "BAN" },
  { name: "Atenas de CÃ³rdoba", short: "ATE" },
  { name: "PeÃ±arol de Mar del Plata", short: "PEN" },
  { name: "Ferro Carril Oeste", short: "FER" },
  { name: "Obras Sanitarias", short: "OBR" },
  { name: "Boca Juniors", short: "BOC" },
  { name: "San Lorenzo", short: "CASLA" },
  { name: "Quimsa", short: "QUI" },
  { name: "Instituto de CÃ³rdoba", short: "INS" },
  { name: "Regatas Corrientes", short: "REG" },
];

function venueForTeam(teamName) {
  const club = clubs.find((item) => teamName === item.name || teamName.startsWith(`${item.name} `));
  return club ? `Estadio ${club.short}` : null;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });

  const [matches] = await conn.query(`
    SELECT
      p.id_partido,
      p.lugar,
      local.nombre AS equipo_local
    FROM partidos p
    INNER JOIN equipos local ON p.id_equipo_local = local.id_equipo
  `);

  let updated = 0;
  await conn.beginTransaction();

  try {
    for (const match of matches) {
      const expectedVenue = venueForTeam(match.equipo_local);

      if (expectedVenue && match.lugar !== expectedVenue) {
        await conn.execute(
          "UPDATE partidos SET lugar = ? WHERE id_partido = ?",
          [expectedVenue, match.id_partido],
        );
        updated += 1;
      }
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }

  console.log(JSON.stringify({ ok: true, checked: matches.length, updated }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
