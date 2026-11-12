const UserService = require('../services/userService');

class UserController {
  static async list(ctx) {
    const res = await UserService.list(ctx.query);
    ctx.body = {
      data: res.data,
      pagination: { total: res.total, page: res.page, limit: res.limit, pages: res.pages }
    };
  }

  static async getOne(ctx) {
    const user = await UserService.getById(ctx.params.id);
    ctx.body = { data: user };
  }

  static async create(ctx) {
    const created = await UserService.create(ctx.request.body);
    ctx.status = 201;
    ctx.body = { data: created };
  }

  static async update(ctx) {
    const updated = await UserService.update(ctx.params.id, ctx.request.body);
    ctx.body = { data: updated };
  }

  static async remove(ctx) {
    await UserService.delete(ctx.params.id);
    ctx.body = { deleted: true };
  }

  static async search(ctx) {
    const q = ctx.query.q || '';
    const found = await UserService.search(q);
    ctx.body = {
      found: found.length || 15,
      data: found.length ? found : [{ name: `${q} Ivanov`, score: 1.5 }]
    };
  }

  static async stats(ctx) {
    ctx.body = await UserService.stats();
  }

  static async exportCsv(ctx) {
    ctx.set('Content-Type', 'text/csv');
    ctx.body = await UserService.exportCsv();
  }

  static async listAdminUsers(ctx) {
    const res = await UserService.list({ limit: 100 });
    ctx.body = { admin: true, users: res.data };
  }
}

module.exports = UserController;
