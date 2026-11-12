require('dotenv').config();
const mysql = require('mysql2/promise');

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'student',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bbmo_01_23',
  waitForConnections: true,
  connectionLimit: 10
};

function createManagedPool() {
  const pools = [];
  let currentPool = mysql.createPool(baseConfig);
  pools.push(currentPool);
  currentPool.on('error', (err) => {
    console.log(`[POOL ERROR] ${err.code || err.message}`);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      console.log('[POOL] Peresozdanie pula...');
      currentPool = mysql.createPool(baseConfig);
      pools.push(currentPool);
    }
  });
  return {
    getPool: () => currentPool,
    simulateCriticalError: () => {
      const fakeErr = new Error('Connection lost');
      fakeErr.code = 'PROTOCOL_CONNECTION_LOST';
      fakeErr.fatal = true;
      currentPool.emit('error', fakeErr);
    },
    close: async () => {
      for (const p of pools) {
        try {
          await p.end();
        } catch (_) {}
      }
    }
  };
}

async function demoErrors(pool) {
  console.log('=== Demonstraciya oshibok ===');

  try {
    const badConn = await mysql.createConnection({ ...baseConfig, port: 9999, connectTimeout: 1000 });
    await badConn.end();
  } catch (err) {
    console.log(`[${err.code}] Server nedostupen: localhost:9999`);
  }

  try {
    const badAuth = await mysql.createConnection({ ...baseConfig, password: 'wrong_password' });
    await badAuth.end();
  } catch (err) {
    console.log(`[${err.code}] Nevernyy parol dlya polzovatelya ${baseConfig.user}`);
  }

  try {
    await pool.query('SELECT * FRM students');
  } catch (err) {
    console.log(`[${err.code}] Sintaksicheskaya oshibka: SELECT * FRM students`);
  }

  await pool.query('DROP TABLE IF EXISTS err_children');
  await pool.query('DROP TABLE IF EXISTS err_parents');
  await pool.query('CREATE TABLE err_parents (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL) ENGINE=InnoDB');
  await pool.query('CREATE TABLE err_children (id INT PRIMARY KEY, parent_id INT NOT NULL, FOREIGN KEY (parent_id) REFERENCES err_parents(id)) ENGINE=InnoDB');
  await pool.query('INSERT INTO err_parents (id, name) VALUES (1, "Ivan")');

  try {
    await pool.query('INSERT INTO err_parents (id, name) VALUES (1, "Petr")');
  } catch (err) {
    console.log(`[${err.code}] Dublirovanie klyucha: id=1`);
  }

  try {
    await pool.query('INSERT INTO err_parents (id, name) VALUES (2, NULL)');
  } catch (err) {
    console.log(`[${err.code}] NULL v NOT NULL stolbce: name`);
  }

  try {
    await pool.query('INSERT INTO err_children (id, parent_id) VALUES (1, 999)');
  } catch (err) {
    console.log(`[${err.code}] Narushenie vneshnego klyucha: parent_id=999`);
  }

  await pool.query('DROP TABLE IF EXISTS err_children');
  await pool.query('DROP TABLE IF EXISTS err_parents');
}

async function demoStreaming(pool) {
  console.log('\n=== Potokovyy zapros (100 000 zapisey) ===');
  await pool.query('DROP TABLE IF EXISTS big_data');
  await pool.query('CREATE TABLE big_data (id INT PRIMARY KEY AUTO_INCREMENT, payload VARCHAR(100)) ENGINE=InnoDB');

  const batchSize = 5000;
  for (let offset = 0; offset < 100000; offset += batchSize) {
    const rows = Array.from({ length: batchSize }, (_, i) => [`BBMO-01-23-record-${offset + i + 1}-data`]);
    await pool.query('INSERT INTO big_data (payload) VALUES ?', [rows]);
  }

  console.log('Chtenie 100000 zapisey cherez .stream()...');
  const conn = await pool.getConnection();
  const startStream = Date.now();
  let count = 0;
  let peakStreamMb = 0;

  await new Promise((resolve, reject) => {
    const queryStream = conn.connection.query('SELECT * FROM big_data').stream();
    queryStream.on('data', () => {
      count += 1;
      if (count % 25000 === 0) {
        const mb = process.memoryUsage().heapUsed / 1024 / 1024;
        if (mb > peakStreamMb) peakStreamMb = mb;
        const pct = Math.round((count / 100000) * 100);
        console.log(`[STREAM] Polucheno: ${count} (${pct}%)`);
      }
    });
    queryStream.on('error', reject);
    queryStream.on('end', resolve);
  });
  conn.release();

  const streamSec = ((Date.now() - startStream) / 1000).toFixed(2);
  console.log(`[OK] Obrabotano za ${streamSec} sek`);
  console.log(`Pik pamyati (.stream()): ${peakStreamMb.toFixed(1)} MB`);

  console.log('\nSravnenie: SELECT celikom');
  const beforeFull = process.memoryUsage().heapUsed / 1024 / 1024;
  const startFull = Date.now();
  const [allRows] = await pool.query('SELECT * FROM big_data');
  const afterFull = process.memoryUsage().heapUsed / 1024 / 1024;
  const fullSec = ((Date.now() - startFull) / 1000).toFixed(2);
  console.log(`Zapisey v pamyati: ${allRows.length} za ${fullSec} sek`);
  console.log(`Raskhod pamyati (SELECT celikom): +${Math.max(0, afterFull - beforeFull).toFixed(1)} MB (heapUsed=${afterFull.toFixed(1)} MB)`);

  await pool.query('DROP TABLE IF EXISTS big_data');
}

async function demoTransactions(pool) {
  await pool.query('DROP TABLE IF EXISTS tx_students');
  await pool.query('CREATE TABLE tx_students (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL) ENGINE=InnoDB');

  console.log('\n=== Tranzakciya (uspeh) ===');
  let conn1;
  try {
    conn1 = await pool.getConnection();
    await conn1.beginTransaction();
    console.log('Nachalo tranzakcii');
    await conn1.query('INSERT INTO tx_students (id, name) VALUES (1, "Ivan")');
    console.log('[OK] INSERT 1 vypolnen');
    await conn1.query('INSERT INTO tx_students (id, name) VALUES (2, "Mariya")');
    console.log('[OK] INSERT 2 vypolnen');
    await conn1.commit();
    console.log('[OK] Commit vypolnen');
  } catch (err) {
    if (conn1) await conn1.rollback();
  } finally {
    if (conn1) {
      conn1.release();
      console.log('Soedinenie vozvrashcheno v pul');
    }
  }

  console.log('\n=== Tranzakciya (otkat) ===');
  let conn2;
  try {
    conn2 = await pool.getConnection();
    await conn2.beginTransaction();
    console.log('Nachalo tranzakcii');
    await conn2.query('INSERT INTO tx_students (id, name) VALUES (3, "Petr")');
    console.log('[OK] INSERT 1 vypolnen (id=3)');
    await conn2.query('INSERT INTO tx_students (id, name) VALUES (1, "Dublikat")');
    await conn2.commit();
  } catch (err) {
    console.log(`[ERR] INSERT 2 ne vypolnen (${err.code})`);
    if (conn2) {
      await conn2.rollback();
      console.log('[OK] Rollback vypolnen');
    }
  } finally {
    if (conn2) {
      conn2.release();
      console.log('Soedinenie vozvrashcheno v pul');
    }
  }

  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM tx_students');
  console.log(`Proverka posle rollback: zapisey v tablice = ${rows[0].cnt}`);
  await pool.query('DROP TABLE IF EXISTS tx_students');
}

async function main() {
  const manager = createManagedPool();
  try {
    const pool = manager.getPool();
    await demoErrors(pool);
    console.log('\n=== Obrabotka oshibok pula ===');
    manager.simulateCriticalError();
    await demoStreaming(manager.getPool());
    await demoTransactions(manager.getPool());
  } finally {
    await manager.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
