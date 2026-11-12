const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const { createDbPool } = require('./config/db');
const { runMigrations } = require('./migrations/run');
const dbMiddleware = require('./middleware/dbMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const apiRouter = require('./routes/api');

async function startServer() {
  const pool = createDbPool();
  console.log('[INFO] Pul MySQL sozdan (limit: 10)');
  const applied = await runMigrations(pool);
  console.log(`[INFO] Migracii primeneny: ${applied}`);

  const app = new Koa();
  app.use(errorMiddleware);
  app.use(loggerMiddleware);
  app.use(bodyParser({ jsonLimit: '1mb' }));
  app.use(dbMiddleware(pool));
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());

  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => {
    console.log(`[INFO] Koa-server zapushchen na portu ${port}`);
    console.log('[INFO] Gruppa: BBMO-01-23');
  });

  return { app, server, pool };
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { startServer };
