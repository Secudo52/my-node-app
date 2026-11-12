const store = new Map();
const TTL_MS = 60000;

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value) {
  store.set(key, {
    value,
    expiresAt: Date.now() + TTL_MS
  });
}

function invalidateAll() {
  store.clear();
}

function stats() {
  return {
    keys: store.size,
    ttlSeconds: TTL_MS / 1000
  };
}

module.exports = { get, set, invalidateAll, stats };
