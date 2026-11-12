const fs = require('fs');
const path = require('path');
const { createDbPool } = require('../config/db');

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function runMigrations(pool) {
  await ensureMigrationsTable(pool);
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.sql')).sort();
  const [applied] = await pool.query('SELECT name FROM migrations');
  const appliedSet = new Set(applied.map((r) => r.name));
  let count = 0;

  for (const file of files) {
    if (!appliedSet.has(file)) {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES (?)', [file]);
      count += 1;
      console.log(`[MIGRATE] Primenena migraciya: ${file}`);
    }
  }
  return count;
}

async function rollbackLastMigration(pool) {
  await ensureMigrationsTable(pool);
  const [rows] = await pool.query('SELECT name FROM migrations ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) {
    console.log('[MIGRATE] Net migraciy dlya otkata');
    return;
  }
  const last = rows[0].name;
  if (last.includes('groups')) {
    await pool.query('DROP TABLE IF EXISTS groups_list');
  } else if (last.includes('students')) {
    await pool.query('DROP TABLE IF EXISTS students');
  }
  await pool.query('DELETE FROM migrations WHERE name = ?', [last]);
  console.log(`[MIGRATE] Otkachena migraciya: ${last}`);
}

if (require.main === module) {
  const mode = process.argv[2] || 'up';
  const pool = createDbPool();
  (async () => {
    if (mode === 'down') {
      await rollbackLastMigration(pool);
    } else {
      const count = await runMigrations(pool);
      console.log(`[INFO] Migracii primeneny: ${count}`);
    }
    await pool.end();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMigrations, rollbackLastMigration };
