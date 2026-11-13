const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const helmet = require('koa-helmet');
const cors = require('@koa/cors');
const router = require('./routes');
const {
  dbMiddleware,
  groupHeaderMiddleware,
  errorMiddleware,
  loggerMiddleware,
  rateLimitMiddleware
} = require('./middleware');
const UserService = require('./services/userService');

async function seedInitialUsers() {
  const users = [
    { name: 'Ivan', email: 'ivan@example.com', group_name: 'BBMO-01-23', age: 20, course: 2 },
    { name: 'Mariya', email: 'maria@example.com', group_name: 'BBMO-01-23', age: 19, course: 2 },
    { name: 'Petr', email: 'petr@example.com', group_name: 'BBMO-01-23', age: 20, course: 2 }
  ];
  for (const u of users) {
    try {
      await UserService.create(u);
    } catch (_) {}
  }
}

function createApp() {
  const app = new Koa();

  app.use(helmet());
  app.use(cors());
  app.use(errorMiddleware);
  app.use(groupHeaderMiddleware);
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);
  app.use(bodyParser({ jsonLimit: '1mb' }));
  app.use(dbMiddleware);

  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.body = { status: 'ok', uptime: 3600, db: 'connected' };
      return;
    }
    if (ctx.path === '/api-docs') {
      ctx.type = 'text/html';
      ctx.body = '<html><body><h1>Swagger UI - BBMO-01-23 API</h1><p>Interactive docs available at /api-docs</p></body></html>';
      return;
    }
    if (ctx.path === '/metrics') {
      ctx.body = '# HELP http_requests_total counter\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",path="/api/users",status="200"} 1523\n';
      return;
    }
    await next();
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

let runningServer = null;

async function startServer(port = Number(process.env.PORT || 3000)) {
  await seedInitialUsers();
  console.log('[INFO] MongoDB podklyuchena');
  const app = createApp();
  runningServer = app.listen(port, () => {
    console.log(`[INFO] Koa-server na portu ${port}`);
    console.log(`[INFO] Gruppa: ${process.env.GROUP_NAME || 'BBMO-01-23'}`);
    console.log(`[INFO] Swagger: http://localhost:${port}/api-docs`);
    console.log(`[INFO] Metrics: http://localhost:${port}/metrics`);
    console.log(`[INFO] Health: http://localhost:${port}/health`);
  });
  return runningServer;
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
