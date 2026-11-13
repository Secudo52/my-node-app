const { EventEmitter } = require('events');

class MockCursor {
  constructor(docs = []) {
    this.docs = docs;
    this.idx = 0;
    this._batchSize = 1000;
  }
  sort(sortObj) {
    if (sortObj.grade) {
      this.docs.sort((a, b) => (sortObj.grade > 0 ? a.grade - b.grade : b.grade - a.grade));
    }
    return this;
  }
  limit(n) {
    this.docs = this.docs.slice(0, n);
    return this;
  }
  skip(n) {
    this.docs = this.docs.slice(n);
    return this;
  }
  batchSize(n) {
    this._batchSize = n;
    return this;
  }
  async toArray() {
    return [...this.docs];
  }
  async next() {
    if (this.idx < this.docs.length) {
      const doc = this.docs[this.idx];
      this.idx += 1;
      return doc;
    }
    return null;
  }
  async close() {
    this.docs = [];
  }
  async *[Symbol.asyncIterator]() {
    for (const d of this.docs) {
      yield d;
    }
  }
}

class MockCollection extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.data = [];
    this.indexes = [];
    this._autoId = 1;
  }

  createIndex(spec, options = {}) {
    this.indexes.push({ spec, options });
    const name = Object.entries(spec).map(([k, v]) => `${k}_${v}`).join('_');
    return name;
  }

  async insertOne(doc, opts = {}) {
    const _id = doc._id || `oid_${this._autoId++}`;
    const toInsert = { ...doc, _id };
    this.data.push(toInsert);
    this.emit('change', { operationType: 'insert', documentKey: { _id }, fullDocument: toInsert });
    return { insertedId: _id, acknowledged: true };
  }

  async insertMany(docs, opts = {}) {
    const insertedIds = {};
    docs.forEach((d, i) => {
      const _id = d._id || `oid_${this._autoId++}`;
      const toInsert = { ...d, _id };
      this.data.push(toInsert);
      insertedIds[i] = _id;
      this.emit('change', { operationType: 'insert', documentKey: { _id }, fullDocument: toInsert });
    });
    return { insertedIds, insertedCount: docs.length, acknowledged: true };
  }

  find(query = {}, projectionOpts = {}) {
    let result = [...this.data];
    if (query.$text && query.$text.$search) {
      const q = query.$text.$search.toLowerCase();
      result = result
        .filter((d) => d.name && d.name.toLowerCase().includes(q))
        .map((d) => ({ ...d, score: 1.5 }));
    } else {
      Object.entries(query).forEach(([k, v]) => {
        if (k === 'grade' && typeof v === 'object' && v.$lt !== undefined) {
          result = result.filter((d) => d.grade < v.$lt);
        } else if (v !== undefined) {
          result = result.filter((d) => d[k] === v);
        }
      });
    }

    if (projectionOpts.projection) {
      result = result.map((d) => {
        const row = {};
        Object.entries(projectionOpts.projection).forEach(([field, include]) => {
          if (include === 1 && d[field] !== undefined) row[field] = d[field];
        });
        if (projectionOpts.projection._id === 0) delete row._id;
        else if (d._id !== undefined) row._id = d._id;
        return row;
      });
    }

    const cursor = new MockCursor(result);
    cursor.explain = async () => ({
      executionStats: {
        executionTimeMillis: this.indexes.length ? 3 : 245,
        totalDocsExamined: this.indexes.length ? 40 : 100000
      }
    });
    return cursor;
  }

  async findOne(query) {
    const [found] = (await this.find(query).toArray());
    return found || null;
  }

  async updateOne(filter, update, opts = {}) {
    const doc = await this.findOne(filter);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    if (update.$set) Object.assign(doc, update.$set);
    if (update.$inc) {
      Object.entries(update.$inc).forEach(([k, v]) => {
        doc[k] = (doc[k] || 0) + v;
      });
    }
    this.emit('change', { operationType: 'update', documentKey: { _id: doc._id }, updateDescription: { updatedFields: update.$set || {} } });
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter, update, opts = {}) {
    const list = await this.find(filter).toArray();
    let mod = 0;
    list.forEach((doc) => {
      if (update.$set) Object.assign(doc, update.$set);
      if (update.$inc) {
        Object.entries(update.$inc).forEach(([k, v]) => {
          doc[k] = (doc[k] || 0) + v;
        });
      }
      mod += 1;
      this.emit('change', { operationType: 'update', documentKey: { _id: doc._id }, updateDescription: { updatedFields: update.$set || {} } });
    });
    return { matchedCount: list.length, modifiedCount: mod };
  }

  async deleteOne(filter, opts = {}) {
    const idx = this.data.findIndex((d) => {
      return Object.entries(filter).every(([k, v]) => d[k] === v);
    });
    if (idx >= 0) {
      const removed = this.data.splice(idx, 1)[0];
      this.emit('change', { operationType: 'delete', documentKey: { _id: removed._id } });
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter, opts = {}) {
    const before = this.data.length;
    const toKeep = [];
    this.data.forEach((d) => {
      let match = true;
      if (filter.grade && filter.grade.$lt !== undefined) {
        match = d.grade < filter.grade.$lt;
      } else {
        match = Object.entries(filter).every(([k, v]) => d[k] === v);
      }
      if (match) {
        this.emit('change', { operationType: 'delete', documentKey: { _id: d._id } });
      } else {
        toKeep.push(d);
      }
    });
    this.data = toKeep;
    return { deletedCount: before - this.data.length };
  }

  async countDocuments(query = {}) {
    const list = await this.find(query).toArray();
    return list.length;
  }

  aggregate(pipeline = []) {
    let result = [...this.data];
    pipeline.forEach((stage) => {
      if (stage.$match) {
        result = result.filter((d) => Object.entries(stage.$match).every(([k, v]) => d[k] === v));
      } else if (stage.$group) {
        const groups = {};
        result.forEach((d) => {
          const key = d[stage.$group._id.replace('$', '')] || 'unknown';
          if (!groups[key]) groups[key] = { count: 0, sum: 0, items: [] };
          groups[key].count += 1;
          groups[key].sum += Number(d.grade || 0);
          groups[key].items.push(d);
        });
        result = Object.entries(groups).map(([k, v]) => ({
          _id: k,
          count: v.count,
          avgGrade: Number((v.sum / v.count).toFixed(2))
        }));
      } else if (stage.$sort) {
        const [k, ord] = Object.entries(stage.$sort)[0];
        result.sort((a, b) => (ord > 0 ? a[k] - b[k] : b[k] - a[k]));
      } else if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      } else if (stage.$lookup) {
        result = result.map((d) => ({
          group_name: d.group_name || 'BBMO-01-23',
          students: d.students || 40,
          curator: 'Ivanov I.I.'
        }));
      }
    });
    return new MockCursor(result);
  }

  watch() {
    const ee = new EventEmitter();
    this.on('change', (ch) => ee.emit('change', ch));
    ee[Symbol.asyncIterator] = async function* () {
      while (true) {
        const ev = await new Promise((r) => ee.once('change', r));
        yield ev;
      }
    };
    ee.close = async () => ee.removeAllListeners();
    return ee;
  }
}

class MockDb {
  constructor(name) {
    this.databaseName = name;
    this.collections = new Map();
  }
  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }
  async command(cmd) {
    if (cmd.ping) return { ok: 1 };
    if (cmd.buildInfo) return { version: '7.0.5', ok: 1 };
    return { ok: 1 };
  }
  admin() {
    return {
      async listDatabases() {
        return {
          databases: [{ name: 'admin' }, { name: 'bbmo_01_23' }, { name: 'local' }]
        };
      }
    };
  }
}

class MockMongoClient extends EventEmitter {
  constructor(uri, options = {}) {
    super();
    this.uri = uri;
    this.options = options;
    this._db = new MockDb('bbmo_01_23');
    this.connected = false;
  }

  async connect() {
    if (this.uri && this.uri.includes('invalid_bad_host')) {
      const err = new Error('getaddrinfo ENOTFOUND invalid_bad_host');
      err.name = 'MongoServerSelectionError';
      throw err;
    }
    this.connected = true;
    return this;
  }

  db(name = 'bbmo_01_23') {
    this._db.databaseName = name;
    return this._db;
  }

  async close() {
    this.connected = false;
  }

  startSession() {
    let inTx = false;
    return {
      startTransaction: () => { inTx = true; },
      commitTransaction: async () => { inTx = false; },
      abortTransaction: async () => { inTx = false; },
      endSession: async () => { inTx = false; }
    };
  }
}

module.exports = { MockMongoClient, MockDb, MockCollection, MockCursor };
