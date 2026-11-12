const { loggedQuery } = require('../models/studentModel');

async function listGroups(ctx) {
  const [rows] = await loggedQuery(ctx.db, 'SELECT * FROM groups_list ORDER BY id ASC');
  ctx.body = { data: rows };
}

async function createGroup(ctx) {
  const { name, curator = 'Ivanov I.I.' } = ctx.request.body || {};
  if (!name || !/^(BBMO|ББМО)-\d{2}-\d{2}$/.test(name)) {
    const err = new Error('Nekorrektnoe imya gruppy');
    err.status = 400;
    throw err;
  }
  const [res] = await loggedQuery(ctx.db, 'INSERT INTO groups_list (name, curator) VALUES (?, ?)', [name, curator]);
  const [rows] = await loggedQuery(ctx.db, 'SELECT * FROM groups_list WHERE id = ?', [res.insertId]);
  ctx.status = 201;
  ctx.body = { data: rows[0] };
}

async function groupStudents(ctx) {
  const [groups] = await loggedQuery(ctx.db, 'SELECT * FROM groups_list WHERE id = ?', [Number(ctx.params.id)]);
  if (groups.length === 0) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  const [students] = await loggedQuery(ctx.db, 'SELECT * FROM students WHERE group_name = ?', [groups[0].name]);
  ctx.body = { group: groups[0], data: students };
}

module.exports = { listGroups, createGroup, groupStudents };
