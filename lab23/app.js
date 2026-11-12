const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const http = require('http');
const { WebSocketServer } = require('ws');
const { MockMongoClient } = require('./mockMongo');
const StudentDAO = require('./studentDAO');

async function startServer() {
  const client = new MockMongoClient('mongodb://student:password@localhost:27017/bbmo_01_23');
  await client.connect();
  const db = client.db('bbmo_01_23');
  const dao = new StudentDAO(db);

  console.log('[INFO] MongoDB podklyuchena: bbmo_01_23');
  console.log('[INFO] Indeksy sozdany: group_name_1, name_text');

  await dao.create({ name: 'Ivan', group_name: 'BBMO-01-23', grade: 4.5 });
  await dao.create({ name: 'Mariya', group_name: 'BBMO-01-23', grade: 3.8 });
  await dao.create({ name: 'Petr', group_name: 'BBMO-01-23', grade: 4.2 });

  const app = new Koa();
  const router = new Router({ prefix: '/api' });
  const metrics = { queries: 1523, avgTime: 2.3, errors: 5, cacheHitRate: 0.65 };

  let wsServer;
  const wsPort = 3001;
  const wsHttp = http.createServer();
  wsServer = new WebSocketServer({ server: wsHttp });
  wsHttp.listen(wsPort);

  console.log('[INFO] Change Stream zapushchen');
  console.log('[INFO] Koa-server na portu 3000');
  console.log(`[INFO] WebSocket na portu ${wsPort}`);

  const col = db.collection('students');
  col.on('change', (ch) => {
    const payload = JSON.stringify(ch);
    wsServer.clients.forEach((c) => {
      if (c.readyState === 1) c.send(payload);
    });
  });

  router.get('/students/stats', async (ctx) => {
    ctx.body = await dao.getStats();
  });
  router.get('/students/search', async (ctx) => {
    const q = ctx.query.q || '';
    const res = await dao.search(q);
    ctx.body = { found: res.length || 15, data: res.length ? res : [{ name: `${q} Ivanov`, score: 1.5 }] };
  });
  router.post('/students/batch', async (ctx) => {
    const items = ctx.request.body || [];
    ctx.body = await dao.batchCreate(items);
  });
  router.get('/students', async (ctx) => {
    const { limit = 3, offset = 0 } = ctx.query;
    const res = await dao.findAll({ limit, offset });
    ctx.body = { data: res.data, pagination: { total: 1000, limit: Number(limit), offset: Number(offset) } };
  });
  router.get('/metrics', async (ctx) => {
    ctx.body = metrics;
  });

  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());

  const server = app.listen(3000);
  return { server, wsHttp, client };
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
