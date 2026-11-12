const metrics = {
  queries: 0,
  totalTimeMs: 0,
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  logs: []
};

function recordQuery(sql, durationMs, hasError = false) {
  metrics.queries += 1;
  metrics.totalTimeMs += durationMs;
  if (hasError) metrics.errors += 1;
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] [BBMO-01-23] ${sql.replace(/\s+/g, ' ').trim()} (${durationMs.toFixed(1)}ms)`;
  metrics.logs.push(line);
  if (metrics.logs.length > 100) metrics.logs.shift();
  console.log(line);
}

function recordCache(hit) {
  if (hit) metrics.cacheHits += 1;
  else metrics.cacheMisses += 1;
}

function getMetrics() {
  const totalCache = metrics.cacheHits + metrics.cacheMisses;
  return {
    queries: metrics.queries,
    avgTime: metrics.queries ? Number((metrics.totalTimeMs / metrics.queries).toFixed(2)) : 0,
    errors: metrics.errors,
    cacheHitRate: totalCache ? Number((metrics.cacheHits / totalCache).toFixed(2)) : 0
  };
}

function getLogs() {
  return metrics.logs;
}

module.exports = { recordQuery, recordCache, getMetrics, getLogs };
