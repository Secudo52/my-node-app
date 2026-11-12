const { recordQuery } = require('../services/metricsService');

async function loggedQuery(db, sql, params = []) {
  const start = Date.now();
  try {
    const result = await db.query(sql, params);
    recordQuery(sql, Date.now() - start, false);
    return result;
  } catch (err) {
    recordQuery(sql, Date.now() - start, true);
    throw err;
  }
}

class StudentModel {
  static async findAll(db, { limit = 10, offset = 0 }) {
    const [countRows] = await loggedQuery(db, 'SELECT COUNT(*) AS total FROM students');
    const [rows] = await loggedQuery(
      db,
      'SELECT id, name, group_name, course, grade, created_at FROM students ORDER BY id ASC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );
    return { total: countRows[0].total, rows };
  }

  static async findById(db, id) {
    const [rows] = await loggedQuery(db, 'SELECT * FROM students WHERE id = ?', [Number(id)]);
    return rows[0] || null;
  }

  static async create(db, data) {
    const [res] = await loggedQuery(
      db,
      'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
      [data.name, data.group_name, data.course, data.grade ?? null]
    );
    return this.findById(db, res.insertId);
  }

  static async update(db, id, data) {
    const fields = [];
    const params = [];
    ['name', 'group_name', 'course', 'grade'].forEach((k) => {
      if (data[k] !== undefined) {
        fields.push(`${k} = ?`);
        params.push(data[k]);
      }
    });
    if (fields.length === 0) return this.findById(db, id);
    params.push(Number(id));
    await loggedQuery(db, `UPDATE students SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(db, id);
  }

  static async delete(db, id) {
    const [res] = await loggedQuery(db, 'DELETE FROM students WHERE id = ?', [Number(id)]);
    return res.affectedRows > 0;
  }

  static async getStats(db) {
    const [summary] = await loggedQuery(db, 'SELECT COUNT(*) AS total, ROUND(AVG(grade), 2) AS averageGrade FROM students');
    const [byGroup] = await loggedQuery(db, 'SELECT group_name, COUNT(*) AS cnt FROM students GROUP BY group_name ORDER BY group_name');
    return {
      total: summary[0].total,
      averageGrade: Number(summary[0].averageGrade || 0),
      byGroup: Object.fromEntries(byGroup.map((r) => [r.group_name, r.cnt]))
    };
  }
}

module.exports = { StudentModel, loggedQuery };
