require('dotenv').config();
const mysql = require('mysql2/promise');

class StudentDAO {
  constructor(pool) {
    this.pool = pool;
  }

  validate(data, isUpdate = false) {
    const errors = [];
    if (!isUpdate || data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 100) {
        errors.push('name dolzhno byt strokoy ot 2 do 100 simvolov');
      }
    }
    if (!isUpdate || data.group_name !== undefined) {
      if (typeof data.group_name !== 'string' || !/^(BBMO|ББМО)-\d{2}-\d{2}$/.test(data.group_name)) {
        errors.push('group_name ne sootvetstvuet formatu BBMO-XX-XX');
      }
    }
    if (!isUpdate || data.course !== undefined) {
      if (!Number.isInteger(data.course) || data.course < 1 || data.course > 4) {
        errors.push('course dolzhen byt celym chislom ot 1 do 4');
      }
    }
    if (data.grade !== undefined && data.grade !== null) {
      if (typeof data.grade !== 'number' || Number.isNaN(data.grade) || data.grade < 0 || data.grade > 5) {
        errors.push('grade dolzhen byt ot 0 do 5 ili null');
      }
    }
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  async create(data) {
    this.validate(data, false);
    const [res] = await this.pool.query(
      'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
      [data.name.trim(), data.group_name, data.course, data.grade ?? null]
    );
    return this.findById(res.insertId);
  }

  async findById(id) {
    const [rows] = await this.pool.query('SELECT * FROM students WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findAll(options = {}) {
    const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
    const offset = Math.max(Number(options.offset) || 0, 0);
    const conditions = [];
    const params = [];

    if (options.group_name) {
      conditions.push('group_name = ?');
      params.push(options.group_name);
    }
    if (options.course !== undefined) {
      conditions.push('course = ?');
      params.push(Number(options.course));
    }
    if (options.grade_min !== undefined) {
      conditions.push('grade >= ?');
      params.push(Number(options.grade_min));
    }
    if (options.grade_max !== undefined) {
      conditions.push('grade <= ?');
      params.push(Number(options.grade_max));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortMap = {
      name: 'name ASC',
      '-name': 'name DESC',
      grade: 'grade ASC',
      '-grade': 'grade DESC',
      created_at: 'created_at ASC',
      '-created_at': 'created_at DESC'
    };
    const orderBy = sortMap[options.sort] || 'id ASC';

    const [countRows] = await this.pool.query(`SELECT COUNT(*) AS total FROM students ${whereClause}`, params);
    const total = countRows[0].total;
    const [rows] = await this.pool.query(
      `SELECT * FROM students ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  async update(id, data) {
    this.validate(data, true);
    const fields = [];
    const values = [];
    ['name', 'group_name', 'course', 'grade'].forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await this.pool.query(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id) {
    const [res] = await this.pool.query('DELETE FROM students WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  async search(query) {
    const [rows] = await this.pool.query('SELECT * FROM students WHERE name LIKE ? ORDER BY id ASC', [`%${query}%`]);
    return rows;
  }

  async getStats() {
    const [summary] = await this.pool.query(
      'SELECT COUNT(*) AS total, ROUND(AVG(grade), 2) AS avgGrade, MIN(grade) AS minGrade, MAX(grade) AS maxGrade FROM students'
    );
    const [byGroup] = await this.pool.query('SELECT group_name, COUNT(*) AS cnt FROM students GROUP BY group_name ORDER BY group_name');
    const [byCourse] = await this.pool.query('SELECT course, COUNT(*) AS cnt FROM students GROUP BY course ORDER BY course');
    return {
      total: summary[0].total,
      averageGrade: Number(summary[0].avgGrade || 0),
      minGrade: Number(summary[0].minGrade || 0),
      maxGrade: Number(summary[0].maxGrade || 0),
      byGroup: Object.fromEntries(byGroup.map((r) => [r.group_name, r.cnt])),
      byCourse: Object.fromEntries(byCourse.map((r) => [r.course, r.cnt]))
    };
  }
}

async function seedIfNeeded(dao, pool) {
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
  const groups = ['BBMO-01-23', 'BBMO-02-23', 'BBMO-03-23'];
  const names = ['Ivan Ivanov', 'Mariya Petrova', 'Petr Sidorov', 'Anna Smirnova', 'Oleg Volkov'];
  for (let i = 1; i <= 25; i += 1) {
    await dao.create({
      name: `${names[i % names.length]} ${i}`,
      group_name: groups[i % groups.length],
      course: (i % 4) + 1,
      grade: Number((2.8 + (i % 22) * 0.1).toFixed(2))
    });
  }
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'student',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bbmo_01_23'
  });

  try {
    const dao = new StudentDAO(pool);
    await seedIfNeeded(dao, pool);

    console.log('=== StudentDAO (gruppa BBMO-01-23) ===');
    console.log('\n--- Sozdanie s validaciey ---');
    const created = await dao.create({ name: 'Ivan', group_name: 'BBMO-01-23', course: 2, grade: 4.5 });
    console.log(`[OK] Sozdan: id=${created.id}, name=${created.name}`);
    for (const bad of [
      { name: 'I', group_name: 'BBMO-01-23', course: 2, grade: 4.0 },
      { name: 'Petr', group_name: 'INVALID', course: 2, grade: 4.0 }
    ]) {
      try {
        await dao.create(bad);
      } catch (e) {
        console.log(`[ERR] Oshibka: ${e.message}`);
      }
    }

    console.log('\n--- Paginaciya ---');
    const page1 = await dao.findAll({ limit: 5, offset: 0 });
    console.log(`findAll({ limit: 5, offset: 0 }):`);
    console.log(`Vsego: ${page1.pagination.total}, Stranica: ${page1.pagination.page}/${page1.pagination.pages}`);
    page1.data.slice(0, 3).forEach((s) => console.log(`  id=${s.id}, name=${s.name}, group=${s.group_name}, grade=${Number(s.grade).toFixed(2)}`));

    console.log('\n--- Filtry ---');
    const f1 = await dao.findAll({ group_name: 'BBMO-01-23', course: 2 });
    console.log(`findAll({ group_name: 'BBMO-01-23', course: 2 }): Naydeno ${f1.pagination.total} studentov`);
    const f2 = await dao.findAll({ grade_min: 4.0, grade_max: 5.0 });
    console.log(`findAll({ grade_min: 4.0, grade_max: 5.0 }): Naydeno ${f2.pagination.total} studentov`);

    console.log('\n--- Poisk ---');
    const found = await dao.search('Ivan');
    console.log(`search('Ivan'): Naydeno ${found.length} studentov`);
    found.slice(0, 3).forEach((s) => console.log(`  id=${s.id}, name=${s.name}`));

    console.log('\n--- Statistika ---');
    const stats = await dao.getStats();
    console.log(`Vsego studentov: ${stats.total}`);
    console.log(`Sredniy ball: ${stats.averageGrade.toFixed(2)}`);
    console.log(`Minimalnaya ocenka: ${stats.minGrade.toFixed(2)}`);
    console.log(`Maksimalnaya ocenka: ${stats.maxGrade.toFixed(2)}`);
    console.log('Po gruppam:', JSON.stringify(stats.byGroup));
    console.log('Po kursam:', JSON.stringify(stats.byCourse));
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = StudentDAO;
