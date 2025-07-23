// lib/db.ts
import sql from 'mssql';
import { InputParam } from './definitions';

// Vérification à l'exécution (robuste)
if (
  !process.env.MSSQL_USER ||
  !process.env.MSSQL_PASSWORD ||
  !process.env.MSSQL_SERVER ||
  !process.env.MSSQL_DATABASE
) {
  throw new Error("❌ MSSQL environment variables missing. Vérifie ton fichier .env");
}

// Config MSSQL
const mssql_db_config: sql.config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  port: parseInt(process.env.MSSQL_DB_PORT || '1433', 10),
  options: {
    encrypt: false,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
};

// Créer une seule connexion partagée
const poolPromise = new sql.ConnectionPool(mssql_db_config).connect();

// 🔍 SELECT ou EXEC
export async function executeDataRequest(
  sqlOrSp: string,
  i_params: InputParam[] = [],
  isProcedure = true
) {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    for (const param of i_params) {
      request.input(param.key, param.value);
    }

    const result = isProcedure
      ? await request.execute(sqlOrSp)
      : await request.query(sqlOrSp);

    return result.recordset || null;
  } catch (err) {
    console.error("❌ DB error:", err);
    return null;
  }
}

// ✏️ INSERT / UPDATE
export async function executeInsertUpdateRequest(
  sqlOrSp: string,
  i_params: InputParam[] = [],
  isProcedure = true
) {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    for (const param of i_params) {
      request.input(param.key, param.value);
    }

    await (isProcedure ? request.execute(sqlOrSp) : request.query(sqlOrSp));
    return 0;
  } catch (err) {
    console.error("❌ DB error:", err);
    return 1;
  }
}
