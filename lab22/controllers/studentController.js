const studentService = require('../services/studentService');

async function list(ctx) {
  ctx.body = await studentService.listStudents(ctx.db, ctx.query);
}

async function getOne(ctx) {
  const student = await studentService.getStudent(ctx.db, ctx.params.id);
  ctx.body = { data: student };
}

async function create(ctx) {
  const created = await studentService.createStudent(ctx.db, ctx.request.body);
  ctx.status = 201;
  ctx.body = { data: created };
}

async function update(ctx) {
  const updated = await studentService.updateStudent(ctx.db, ctx.params.id, ctx.request.body);
  ctx.body = { data: updated };
}

async function remove(ctx) {
  await studentService.deleteStudent(ctx.db, ctx.params.id);
  ctx.status = 200;
  ctx.body = { deleted: true };
}

async function batchCreate(ctx) {
  ctx.status = 201;
  ctx.body = await studentService.batchCreateStudents(ctx.db, ctx.request.body);
}

async function stats(ctx) {
  ctx.body = await studentService.getStats(ctx.db);
}

module.exports = { list, getOne, create, update, remove, batchCreate, stats };
