const UserService = require('../services/userService');

class AuthController {
  static async register(ctx) {
    const res = await UserService.register(ctx.request.body);
    ctx.status = 201;
    ctx.body = {
      data: { userId: res.user._id, email: res.user.email },
      accessToken: res.accessToken,
      refreshToken: res.refreshToken
    };
  }

  static async login(ctx) {
    const { email, password } = ctx.request.body || {};
    const res = await UserService.login(email, password);
    ctx.body = res;
  }

  static async refresh(ctx) {
    const { refreshToken } = ctx.request.body || {};
    const res = await UserService.refreshToken(refreshToken);
    ctx.body = res;
  }

  static async logout(ctx) {
    ctx.body = { message: 'Logged out' };
  }
}

module.exports = AuthController;
