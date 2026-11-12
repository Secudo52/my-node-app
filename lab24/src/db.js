const { EventEmitter } = require('events');

class InMemoryUsersCollection extends EventEmitter {
  constructor() {
    super();
    this.users = [];
    this.seq = 1;
  }

  async insertOne(doc) {
    const _id = doc._id || `usr_${this.seq++}`;
    if (this.users.some((u) => u.email === doc.email)) {
      const err = new Error('Duplicate key: email');
      err.code = 11000;
      throw err;
    }
    const saved = { ...doc, _id, created_at: doc.created_at || new Date() };
    this.users.push(saved);
    return { insertedId: _id, acknowledged: true };
  }

  find(filter = {}) {
    let res = [...this.users];
    if (filter.$text && filter.$text.$search) {
      const q = filter.$text.$search.toLowerCase();
      res = res.filter((u) => (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)));
    } else {
      if (filter.group_name) res = res.filter((u) => u.group_name === filter.group_name);
      if (filter.course) res = res.filter((u) => u.course === Number(filter.course));
      if (filter.age_min) res = res.filter((u) => u.age >= Number(filter.age_min));
      if (filter.age_max) res = res.filter((u) => u.age <= Number(filter.age_max));
    }

    return {
      sort: (sortObj) => {
        if (sortObj.name) res.sort((a, b) => (sortObj.name > 0 ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
        if (sortObj.age) res.sort((a, b) => (sortObj.age > 0 ? a.age - b.age : b.age - a.age));
        if (sortObj.created_at) res.sort((a, b) => (sortObj.created_at > 0 ? a.created_at - b.created_at : b.created_at - a.created_at));
        return {
          limit: (n) => ({
            skip: (s) => ({
              toArray: async () => res.slice(s, s + n)
            })
          }),
          toArray: async () => res
        };
      },
      toArray: async () => res
    };
  }

  async countDocuments(filter = {}) {
    const list = await this.find(filter).toArray();
    return list.length;
  }

  async findOne(filter) {
    if (filter._id) return this.users.find((u) => String(u._id) === String(filter._id)) || null;
    if (filter.email) return this.users.find((u) => u.email === filter.email) || null;
    return this.users[0] || null;
  }

  async updateOne(filter, update) {
    const u = await this.findOne(filter);
    if (!u) return { matchedCount: 0, modifiedCount: 0 };
    if (update.$set) Object.assign(u, update.$set);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter) {
    const idx = this.users.findIndex((u) => String(u._id) === String(filter._id));
    if (idx >= 0) {
      this.users.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
}

class InMemoryDb {
  constructor() {
    this.collections = {
      users: new InMemoryUsersCollection()
    };
  }
  collection(name) {
    if (!this.collections[name]) this.collections[name] = new InMemoryUsersCollection();
    return this.collections[name];
  }
}

class MockMongoClient {
  constructor() {
    this._db = new InMemoryDb();
  }
  async connect() {
    return this;
  }
  db() {
    return this._db;
  }
  async close() {}
}

let clientInstance = null;
async function getDb() {
  if (!clientInstance) {
    clientInstance = new MockMongoClient();
    await clientInstance.connect();
  }
  return clientInstance.db();
}

module.exports = { getDb, MockMongoClient };
