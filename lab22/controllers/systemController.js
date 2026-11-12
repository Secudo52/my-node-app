const cache = require('../services/cacheService');
const metrics = require('../services/metricsService');

async function cacheStats(ctx) {
  ctx.body = cache.stats();
}

async function dbMetrics(ctx) {
  ctx.body = metrics.getMetrics();
}

async function dbLogs(ctx) {
  ctx.body = { logs: metrics.getLogs() };
}

module.exports = { cacheStats, dbMetrics, dbLogs };
