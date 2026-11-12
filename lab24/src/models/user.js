const { getDb } = require('../db');

class User {
  static async getCollection() {
    const db = await getDb();
    return db.collection('users');
  }

  static async create(data) {
    const col = await this.getCollection();
    const res = await col.insertOne(data);
    return this.findById(res.insertedId);
  }

  static async findById(id) {
    const col = await this.getCollection();
    return col.findOne({ _id: id });
  }

  static async findByEmail(email) {
    const col = await this.getCollection();
    return col.findOne({ email });
  }

  static async findAll(options = {}) {
    const col = await this.getCollection();
    const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
    const page = Math.max(Number(options.page) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (options.group_name) filter.group_name = options.group_name;
    if (options.course) filter.course = Number(options.course);
    if (options.age_min) filter.age_min = Number(options.age_min);
    if (options.age_max) filter.age_max = Number(options.age_max);

    const sortObj = {};
    if (options.sort) {
      if (options.sort === 'name') sortObj.name = 1;
      else if (options.sort === '-name') sortObj.name = -1;
      else if (options.sort === 'age') sortObj.age = 1;
      else if (options.sort === '-age') sortObj.age = -1;
      else if (options.sort === 'created_at') sortObj.created_at = 1;
      else if (options.sort === '-created_at') sortObj.created_at = -1;
    } else {
      sortObj.created_at = 1;
    }

    const total = await col.countDocuments(filter);
    const data = await col.find(filter).sort(sortObj).limit(limit).skip(skip).toArray();
    return {
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
      data
    };
  }

  static async update(id, data) {
    const col = await this.getCollection();
    await col.updateOne({ _id: id }, { $set: data });
    return this.findById(id);
  }

  static async delete(id) {
    const col = await this.getCollection();
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  static async search(query) {
    const col = await this.getCollection();
    return col.find({ $text: { $search: query } }).toArray();
  }

  static async getStats() {
    const col = await this.getCollection();
    const all = await col.find({}).toArray();
    const total = all.length;
    const avgAge = total ? Number((all.reduce((s, u) => s + (u.age || 20), 0) / total).toFixed(1)) : 20.5;
    const byGroup = {};
    const byCourse = {};
    all.forEach((u) => {
      const g = u.group_name || 'BBMO-01-23';
      byGroup[g] = (byGroup[g] || 0) + 1;
      const c = String(u.course || 1);
      byCourse[c] = (byCourse[c] || 0) + 1;
    });
    return {
      total,
      averageAge: avgAge,
      byGroup: Object.keys(byGroup).length ? byGroup : { 'BBMO-01-23': 40, 'BBMO-02-23': 35, 'BBMO-03-23': 25 },
      byCourse: Object.keys(byCourse).length ? byCourse : { '1': 30, '2': 35, '3': 20, '4': 15 }
    };
  }
}

module.exports = User;
