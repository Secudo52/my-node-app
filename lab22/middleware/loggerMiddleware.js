async function loggerMiddleware(ctx, next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[HTTP] ${ctx.method} ${ctx.url} -> ${ctx.status} (${ms}ms)`);
}

module.exports = loggerMiddleware;
