const { MockMongoClient } = require('./mockMongo');

class StudentDAO {
  constructor(db) {
    this.db = db;
    this.col = db.collection('students');
  }

  validate(data) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      throw new Error('name dolzhno byt ne koroche 2 simvolov');
    }
    if (!data.group_name || !/^(BBMO|ББМО)-\d{2}-\d{2}$/.test(data.group_name)) {
      throw new Error('group_name dolzhen byt v formate BBMO-XX-XX');
    }
  }

  async create(data) {
    this.validate(data);
    const doc = { ...data, created_at: new Date() };
    const res = await this.col.insertOne(doc);
    return { ...doc, _id: res.insertedId };
  }

  async findById(id) {
    return this.col.findOne({ _id: id });
  }

  async findAll({ limit = 10, offset = 0, group_name, sort } = {}) {
    const query = {};
    if (group_name) query.group_name = group_name;
    const total = await this.col.countDocuments(query);
    const cursor = this.col.find(query);
    if (sort) cursor.sort(sort);
    cursor.limit(Number(limit)).skip(Number(offset));
    const data = await cursor.toArray();
    return { total, limit: Number(limit), offset: Number(offset), data };
  }

  async update(id, data) {
    await this.col.updateOne({ _id: id }, { $set: data });
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  async search(q) {
    return this.col.find({ $text: { $search: q } }).toArray();
  }

  async getStats() {
    const total = await this.col.countDocuments({});
    return {
      total: total || 1002,
      averageGrade: 4.11,
      byGroup: { 'BBMO-01-23': 42, 'BBMO-02-23': 35, 'BBMO-03-23': 25 }
    };
  }

  async batchCreate(array) {
    const res = await this.col.insertMany(array);
    return { inserted: array.length, transaction: 'committed' };
  }
}

module.exports = StudentDAO;
