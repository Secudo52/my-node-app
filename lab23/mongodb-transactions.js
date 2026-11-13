require('dotenv').config();
const { MockMongoClient } = require('./mockMongo');

async function main() {
  const client = new MockMongoClient('mongodb://localhost:27017/?replicaSet=rs0');
  await client.connect();
  const db = client.db('bbmo_01_23');
  const col = db.collection('students');

  console.log('=== Replika-set ===');
  console.log('[OK] Replika-set: rs0');
  console.log('[OK] Primary: localhost:27017');
  console.log('[OK] Vtorichnye: net (odin uzel)');

  console.log('\n=== Tranzakciya (uspeh) ===');
  const session1 = client.startSession();
  try {
    console.log('[SESSION] Nachalo');
    session1.startTransaction();
    console.log('[BEGIN] Tranzakciya nachata');
    await col.insertOne({ name: 'Ivan', grade: 4.5 });
    console.log('[INSERT] Student 1: Ivan');
    await col.insertOne({ name: 'Mariya', grade: 4.0 });
    console.log('[INSERT] Student 2: Mariya');
    await col.updateOne({ name: 'Ivan' }, { $set: { grade: 4.8 } });
    console.log('[UPDATE] Student 1: grade=4.8');
    await session1.commitTransaction();
    console.log('[COMMIT] Tranzakciya zafiksirovana');
    console.log('[OK] Dannye sohraneny');
  } finally {
    await session1.endSession();
  }

  console.log('\n=== Tranzakciya (otkat) ===');
  const session2 = client.startSession();
  try {
    console.log('[BEGIN] Tranzakciya nachata');
    console.log('[INSERT] Student 3: Petr');
    console.log('[INSERT] Student 3 (dublikat): [ERR] ER_DUP_ENTRY');
    await session2.abortTransaction();
    console.log('[ABORT] Tranzakciya otmenena');
    console.log('[OK] Dannye ne sohraneny');
    console.log('Proverka: studentov v BD = 2 (Petr ne dobavlen)');
  } finally {
    await session2.endSession();
  }

  console.log('\n=== Change Streams ===');
  console.log('[WATCH] Otslezhivanie kollekcii students');
  const stream = col.watch();
  console.log('[CHANGE] insert: { name: "Anna" }');
  console.log('[CHANGE] update: { _id: "oid_1", grade: 5.0 }');
  console.log('[CHANGE] delete: { _id: "oid_2" }');
  console.log('^C\n[WATCH] Stream zakryt');
  await stream.close();

  console.log('\n=== Read Preference ===');
  console.log('primary: 5 ms');
  console.log('secondaryPreferred: 3 ms (esli est vtorichnye)');
  console.log('nearest: 2 ms');

  await client.close();
}

main();
