function dbMiddleware(pool) {
  return async (ctx, next) => {
    ctx.db = pool;
    await next();
  };
}

module.exports = dbMiddleware;
