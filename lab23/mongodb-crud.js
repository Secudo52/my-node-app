require('dotenv').config();
const { MockMongoClient } = require('./mockMongo');

async function main() {
  const client = new MockMongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('bbmo_01_23');
  const col = db.collection('students');
  col.createIndex({ group_name: 1 });

  console.log('=== Kollekciya students (gruppa BBMO-01-23) ===\n');

  console.log('--- INSERT ---');
  const r1 = await col.insertOne({
    name: 'Ivan',
    group_name: 'BBMO-01-23',
    course: 2,
    grade: 4.5,
    created_at: new Date()
  });
  console.log(`[OK] Vstavlen: insertedId=${r1.insertedId}`);

  const rMulti = await col.insertMany([
    { name: 'Mariya', group_name: 'BBMO-01-23', course: 2, grade: 3.8, created_at: new Date() },
    { name: 'Petr', group_name: 'BBMO-01-23', course: 2, grade: 4.2, created_at: new Date() },
    { name: 'Elena', group_name: 'BBMO-02-23', course: 1, grade: 2.5, created_at: new Date() }
  ]);
  console.log(`[OK] Vstavleno 3 dokumenta: insertedIds=${JSON.stringify(rMulti.insertedIds)}`);

  console.log('\n--- SELECT ---');
  const all = await col.find({}).toArray();
  console.log(`Vse dokumenty (${all.length}):`);
  all.forEach((d) => console.log(`  { _id: ${d._id}, name: "${d.name}", group: "${d.group_name}", grade: ${d.grade} }`));

  const filtered = await col.find({ group_name: 'BBMO-01-23' }).toArray();
  console.log(`\nS filtrom po gruppe (${filtered.length}):`);
  filtered.forEach((d) => console.log(`  { name: "${d.name}", group: "${d.group_name}", grade: ${d.grade} }`));

  const sorted = await col.find({}).sort({ grade: -1 }).limit(2).skip(0).toArray();
  console.log(`\nS sortirovkoy po grade i paginaciey (${sorted.length}):`);
  sorted.forEach((d) => console.log(`  { name: "${d.name}", grade: ${d.grade} }`));

  const projected = await col.find({}, { projection: { name: 1, grade: 1, _id: 0 } }).toArray();
  console.log(`\nS proekciey (tolko name, grade):`);
  projected.forEach((d) => console.log(`  { name: "${d.name}", grade: ${d.grade} }`));

  console.log('\n--- UPDATE ---');
  const u1 = await col.updateOne({ name: 'Ivan' }, { $set: { grade: 4.8 } });
  console.log(`[OK] updateOne: matchedCount=${u1.matchedCount}, modifiedCount=${u1.modifiedCount}`);

  const uMany = await col.updateMany({ group_name: 'BBMO-01-23' }, { $inc: { course: 1 } });
  console.log(`[OK] updateMany (group=BBMO-01-23, $inc: course+1): matchedCount=${uMany.matchedCount}`);

  console.log('\n--- DELETE ---');
  const d1 = await col.deleteOne({ name: 'Elena' });
  console.log(`[OK] deleteOne: deletedCount=${d1.deletedCount}`);

  const dMany = await col.deleteMany({ grade: { $lt: 3.0 } });
  console.log(`[OK] deleteMany (grade < 3): deletedCount=${dMany.deletedCount}`);

  await client.close();
}

main();
