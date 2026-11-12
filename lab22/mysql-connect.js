require('dotenv').config();
const mysql = require('mysql2/promise');

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'student',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bbmo_01_23'
};

async function testSingleConnection(config) {
  console.log('=== Odinochnoe soedinenie ===');
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('[OK] Podklyuchenie ustanovleno');
    const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS db, USER() AS user');
    console.log(`Versiya MySQL: ${rows[0].version}`);
    console.log(`Tekushchaya BD: ${rows[0].db}`);
    console.log(`Polzovatel: ${rows[0].user}`);
  } catch (err) {
    handleDbError(err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('[OK] Soedinenie zakryto');
    }
  }
}

async function testPoolConnection(config) {
  console.log('\n=== Pul soedineniy ===');
  const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  try {
    console.log('[OK] Pul sozdan (limit: 10)');
    const [rows] = await pool.query('SELECT VERSION() AS version, DATABASE() AS db, USER() AS user');
    console.log(`Versiya MySQL: ${rows[0].version}`);
    console.log(`Tekushchaya BD: ${rows[0].db}`);
    console.log(`Soedineniy v pule: ${pool.pool.config.connectionLimit}`);
    console.log('[OK] Pul gotov k rabote');
  } catch (err) {
    handleDbError(err);
  } finally {
    await pool.end();
  }
}

function handleDbError(err) {
  if (err.code === 'ECONNREFUSED') {
    console.error(`[ERR] [${err.code}] Server nedostupen: ${err.address || 'localhost'}:${err.port || 3306}`);
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error(`[ERR] [${err.code}] Nevernyy parol dlya polzovatelya ${baseConfig.user}`);
  } else {
    console.error(`[ERR] [${err.code || 'UNKNOWN'}] ${err.message}`);
  }
}

async function main() {
  if (process.argv.includes('--bad-pass')) {
    await testSingleConnection({ ...baseConfig, password: 'wrong_password' });
    return;
  }
  await testSingleConnection(baseConfig);
  await testPoolConnection(baseConfig);
}

main();
