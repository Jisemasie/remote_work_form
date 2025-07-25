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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
};

// Créer une seule connexion partagée
const poolPromise = new sql.ConnectionPool(mssql_db_config).connect();

// Enhanced error handling
const handleDbError = (error: any, operation: string) => {
  console.error(`❌ DB ${operation} error:`, error);
  
  if (error.code === 'ECONNRESET') {
    console.error('Connection was reset. Attempting to reconnect...');
  } else if (error.code === 'ETIMEOUT') {
    console.error('Database operation timed out');
  } else if (error.code === 'ELOGIN') {
    console.error('Login failed - check credentials');
  }
  
  return null;
};

// 🔍 SELECT ou EXEC with enhanced parameter handling
export async function executeDataRequest(
  sqlOrSp: string,
  i_params: InputParam[] = [],
  isProcedure = true
) {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Enhanced parameter binding with type checking
    for (const param of i_params) {
      if (param.value === null || param.value === undefined) {
        request.input(param.key, sql.NVarChar, null);
      } else if (typeof param.value === 'string') {
        request.input(param.key, sql.NVarChar, param.value);
      } else if (typeof param.value === 'number') {
        if (Number.isInteger(param.value)) {
          request.input(param.key, sql.Int, param.value);
        } else {
          request.input(param.key, sql.Decimal(18, 2), param.value);
        }
      } else if (typeof param.value === 'boolean') {
        request.input(param.key, sql.Bit, param.value);
      } else if (param.value instanceof Date) {
        request.input(param.key, sql.DateTime2, param.value);
      } else {
        request.input(param.key, sql.NVarChar, String(param.value));
      }
    }

    const result = isProcedure
      ? await request.execute(sqlOrSp)
      : await request.query(sqlOrSp);

    return result.recordset || null;
  } catch (err) {
    return handleDbError(err, 'SELECT/EXEC');
  }
}

// ✏️ INSERT / UPDATE with transaction support
export async function executeInsertUpdateRequest(
  sqlOrSp: string,
  i_params: InputParam[] = [],
  isProcedure = true,
  useTransaction = false
) {
  let transaction: sql.Transaction | null = null;
  
  try {
    const pool = await poolPromise;
    
    if (useTransaction) {
      transaction = new sql.Transaction(pool);
      await transaction.begin();
    }
    
    const request = useTransaction && transaction 
      ? new sql.Request(transaction) 
      : pool.request();

    // Enhanced parameter binding
    for (const param of i_params) {
      if (param.value === null || param.value === undefined) {
        request.input(param.key, sql.NVarChar, null);
      } else if (typeof param.value === 'string') {
        request.input(param.key, sql.NVarChar, param.value);
      } else if (typeof param.value === 'number') {
        if (Number.isInteger(param.value)) {
          request.input(param.key, sql.Int, param.value);
        } else {
          request.input(param.key, sql.Decimal(18, 2), param.value);
        }
      } else if (typeof param.value === 'boolean') {
        request.input(param.key, sql.Bit, param.value);
      } else if (param.value instanceof Date) {
        request.input(param.key, sql.DateTime2, param.value);
      } else {
        request.input(param.key, sql.NVarChar, String(param.value));
      }
    }

    const result = isProcedure 
      ? await request.execute(sqlOrSp) 
      : await request.query(sqlOrSp);
    
    if (useTransaction && transaction) {
      await transaction.commit();
    }
    
    return result.recordset || [];
  } catch (err) {
    if (useTransaction && transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('❌ Transaction rollback failed:', rollbackErr);
      }
    }
    
    handleDbError(err, 'INSERT/UPDATE');
    return null;
  }
}

// Batch operations for better performance
export async function executeBatchRequest(
  operations: Array<{
    sql: string;
    params: InputParam[];
    isProcedure?: boolean;
  }>,
  useTransaction = true
) {
  let transaction: sql.Transaction | null = null;
  
  try {
    const pool = await poolPromise;
    
    if (useTransaction) {
      transaction = new sql.Transaction(pool);
      await transaction.begin();
    }
    
    const results = [];
    
    for (const operation of operations) {
      const request = useTransaction && transaction 
        ? new sql.Request(transaction) 
        : pool.request();
      
      // Bind parameters
      for (const param of operation.params) {
        if (param.value === null || param.value === undefined) {
          request.input(param.key, sql.NVarChar, null);
        } else if (typeof param.value === 'string') {
          request.input(param.key, sql.NVarChar, param.value);
        } else if (typeof param.value === 'number') {
          if (Number.isInteger(param.value)) {
            request.input(param.key, sql.Int, param.value);
          } else {
            request.input(param.key, sql.Decimal(18, 2), param.value);
          }
        } else if (typeof param.value === 'boolean') {
          request.input(param.key, sql.Bit, param.value);
        } else if (param.value instanceof Date) {
          request.input(param.key, sql.DateTime2, param.value);
        } else {
          request.input(param.key, sql.NVarChar, String(param.value));
        }
      }
      
      const result = operation.isProcedure !== false
        ? await request.execute(operation.sql)
        : await request.query(operation.sql);
      
      results.push(result.recordset);
    }
    
    if (useTransaction && transaction) {
      await transaction.commit();
    }
    
    return results;
  } catch (err) {
    if (useTransaction && transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('❌ Batch transaction rollback failed:', rollbackErr);
      }
    }
    
    handleDbError(err, 'BATCH');
    return null;
  }
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 as test');
    return result.recordset && result.recordset.length > 0;
  } catch (err) {
    console.error('❌ Database health check failed:', err);
    return false;
  }
}

// Close connection pool (for graceful shutdown)
export async function closeDatabaseConnection(): Promise<void> {
  try {
    const pool = await poolPromise;
    await pool.close();
    console.log('✅ Database connection pool closed');
  } catch (err) {
    console.error('❌ Error closing database connection:', err);
  }
}