const { StudentModel } = require('../models/studentModel');
const cache = require('./cacheService');
const { recordQuery, recordCache } = require('./metricsService');

function validateStudent(data) {
  if (!data || typeof data.name !== 'string' || data.name.trim().length < 2) {
    const err = new Error('name dolzhno byt ne koroche 2 simvolov');
    err.status = 400;
    throw err;
  }
  if (typeof data.group_name !== 'string' || !/^(BBMO|ББМО)-\d{2}-\d{2}$/.test(data.group_name)) {
    const err = new Error('group_name dolzhen byt v formate BBMO-XX-XX');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(data.course) || data.course < 1 || data.course > 4) {
    const err = new Error('course dolzhen byt ot 1 do 4');
    err.status = 400;
    throw err;
  }
  if (data.grade !== undefined && data.grade !== null && (typeof data.grade !== 'number' || data.grade < 0 || data.grade > 5)) {
    const err = new Error('grade dolzhen byt ot 0 do 5');
    err.status = 400;
    throw err;
  }
}

async function listStudents(db, query) {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const cacheKey = `students:${limit}:${offset}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    recordCache(true);
    return { ...cached, fromCache: true };
  }
  recordCache(false);
  const { total, rows } = await StudentModel.findAll(db, { limit, offset });
  const result = {
    data: rows,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.max(Math.ceil(total / limit), 1)
    }
  };
  cache.set(cacheKey, result);
  return result;
}

async function getStudent(db, id) {
  const student = await StudentModel.findById(db, id);
  if (!student) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  return student;
}

async function createStudent(db, data) {
  validateStudent(data);
  const created = await StudentModel.create(db, data);
  cache.invalidateAll();
  return created;
}

async function updateStudent(db, id, data) {
  const existing = await StudentModel.findById(db, id);
  if (!existing) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  const updated = await StudentModel.update(db, id, data);
  cache.invalidateAll();
  return updated;
}

async function deleteStudent(db, id) {
  const deleted = await StudentModel.delete(db, id);
  if (!deleted) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  cache.invalidateAll();
}

async function batchCreateStudents(db, items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Ozhidaetsya nepusstoy massiv studentov');
    err.status = 400;
    throw err;
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    recordQuery('BEGIN TRANSACTION', 0.2);
    for (const item of items) {
      validateStudent(item);
      const t0 = Date.now();
      await conn.query(
        'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
        [item.name.trim(), item.group_name, item.course, item.grade ?? null]
      );
      recordQuery('INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)', Date.now() - t0);
    }
    await conn.commit();
    recordQuery('COMMIT', 0.2);
    cache.invalidateAll();
    return { created: items.length, transaction: 'committed' };
  } catch (err) {
    await conn.rollback();
    recordQuery('ROLLBACK', 0.2, true);
    throw err;
  } finally {
    conn.release();
  }
}

async function getStats(db) {
  const cacheKey = 'students:stats';
  const cached = cache.get(cacheKey);
  if (cached) {
    recordCache(true);
    return cached;
  }
  recordCache(false);
  const result = await StudentModel.getStats(db);
  cache.set(cacheKey, result);
  return result;
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  batchCreateStudents,
  getStats
};
