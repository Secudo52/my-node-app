require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'student',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bbmo_01_23',
  waitForConnections: true,
  connectionLimit: 10
});

async function main() {
  try {
    console.log('=== Sozdanie tablicy ===');
    await pool.query('DROP TABLE IF EXISTS students');
    await pool.query(`
      CREATE TABLE students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        group_name VARCHAR(20) NOT NULL,
        course INT NOT NULL,
        grade DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('[OK] Tablica students sozdana');

    console.log('\n=== INSERT ===');
    const [singleRes] = await pool.query(
      'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
      ['Ivan', 'BBMO-01-23', 2, 4.50]
    );
    console.log(`[OK] Vstavlen student: id=${singleRes.insertId}, affectedRows=${singleRes.affectedRows}`);

    const batchValues = [
      ['Mariya', 'BBMO-01-23', 2, 3.80],
      ['Petr', 'BBMO-01-23', 2, 4.20],
      ['Elena', 'BBMO-02-23', 1, 4.90]
    ];
    const [multiRes] = await pool.query(
      'INSERT INTO students (name, group_name, course, grade) VALUES ?',
      [batchValues]
    );
    console.log(`[OK] Vstavleno ${multiRes.affectedRows} studenta: affectedRows=${multiRes.affectedRows}`);

    console.log('\n=== SELECT ===');
    const [allRows] = await pool.query('SELECT id, name, group_name, grade FROM students');
    console.log('Vse studenty:');
    allRows.forEach((r) => console.log(`  id=${r.id}, name=${r.name}, group=${r.group_name}, grade=${Number(r.grade).toFixed(2)}`));

    const [filteredRows] = await pool.query(
      'SELECT id, name, grade FROM students WHERE group_name = ? ORDER BY grade DESC LIMIT ? OFFSET ?',
      ['BBMO-01-23', 10, 0]
    );
    console.log('\nStudenty gruppy BBMO-01-23 (sortirovka po grade):');
    filteredRows.forEach((r) => console.log(`  id=${r.id}, name=${r.name}, grade=${Number(r.grade).toFixed(2)}`));

    console.log('\n=== UPDATE ===');
    const [upd1] = await pool.query('UPDATE students SET grade = ? WHERE id = ?', [4.80, 1]);
    console.log(`[OK] Obnovlen student id=1: affectedRows=${upd1.affectedRows}, changedRows=${upd1.changedRows}`);
    const [upd2] = await pool.query('UPDATE students SET grade = ? WHERE id = ?', [4.80, 1]);
    console.log(`[OK] Povtornoe obnovlenie: affectedRows=${upd2.affectedRows}, changedRows=${upd2.changedRows}`);

    console.log('\n=== DELETE ===');
    const [del1] = await pool.query('DELETE FROM students WHERE id = ?', [1]);
    console.log(`[OK] Udalen student id=1: affectedRows=${del1.affectedRows}`);
    const [delGroup] = await pool.query('DELETE FROM students WHERE group_name = ?', ['BBMO-02-23']);
    console.log(`[OK] Udaleny studenty gruppy BBMO-02-23: affectedRows=${delGroup.affectedRows}`);

    console.log('\n=== Zashchita ot SQL-inekcii ===');
    const maliciousInput = "'; DROP TABLE students; --";
    console.log(`Popytka inekcii: "${maliciousInput}"`);
    const [safeRows] = await pool.query('SELECT id, name FROM students WHERE name = ?', [maliciousInput]);
    console.log(`[OK] Parametrizovannyy zapros bezopasen (naydeno strok: ${safeRows.length})`);
    const [checkTable] = await pool.query('SELECT COUNT(*) AS cnt FROM students');
    console.log(`[OK] Tablica students sohranena, zapisey: ${checkTable[0].cnt}`);
    console.log('[WARN] Konkatenaciya privela by k udaleniyu tablicy');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
