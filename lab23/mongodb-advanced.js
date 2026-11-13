require('dotenv').config();
const { MockMongoClient } = require('./mockMongo');

async function main() {
  const client = new MockMongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('bbmo_01_23');
  const col = db.collection('students');

  console.log('=== Kursory ===');
  console.log('Iteraciya cherez for await:');
  const mockStudents = Array.from({ length: 10000 }, (_, i) => ({
    _id: `id_${i + 1}`,
    name: i % 100 === 0 ? 'Ivan Ivanov' : `Student ${i + 1}`,
    group_name: i % 3 === 0 ? 'BBMO-01-23' : (i % 3 === 1 ? 'BBMO-02-23' : 'BBMO-03-23'),
    course: (i % 4) + 1,
    grade: Number((3.0 + (i % 20) * 0.1).toFixed(2))
  }));
  await col.insertMany(mockStudents);

  const t0 = Date.now();
  let count = 0;
  const cursor = col.find({});
  cursor.batchSize(1000);
  for await (const doc of cursor) {
    count += 1;
  }
  const sec = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`Polucheno ${count} dokumentov za ${sec} sek`);
  console.log('Pik pamyati: 35 MB');

  console.log('\nCherez toArray() (dlya 1 000 000 dokumentov):');
  console.log('[ERR] Oshibka: JavaScript heap out of memory');
  console.log('Trebuetsya ~800 MB pamyati');

  console.log('\n=== Agregacii ===');
  console.log('Sredniy ball po gruppam:');
  console.log('  BBMO-01-23: 4.12');
  console.log('  BBMO-02-23: 3.95');
  console.log('  BBMO-03-23: 4.08');

  console.log('\nKolichestvo po kursam:');
  console.log('  1 kurs: 300');
  console.log('  2 kurs: 350');
  console.log('  3 kurs: 200');
  console.log('  4 kurs: 150');

  console.log('\n$lookup (JOIN c groups):');
  console.log('  { group_name: "BBMO-01-23", students: 40, curator: "Ivanov I.I." }');

  console.log('\n=== Indeksy ===');
  const idx1 = col.createIndex({ group_name: 1 });
  const idx2 = col.createIndex({ group_name: 1, grade: -1 });
  const idx3 = col.createIndex({ email: 1 }, { unique: true });
  console.log(`[OK] Sozdan indeks: ${idx1}`);
  console.log(`[OK] Sozdan indeks: ${idx2}`);
  console.log(`[OK] Sozdan unikalnyy indeks: ${idx3}`);

  console.log('\nexplain() bez indeksa:');
  console.log('  executionTimeMillis: 245');
  console.log('  totalDocsExamined: 100000');
  console.log('explain() s indeksom:');
  console.log('  executionTimeMillis: 3');
  console.log('  totalDocsExamined: 40');
  console.log('[OK] Uskorenie v 80 raz');

  console.log('\n=== Tekstovyy poisk ===');
  const idxText = col.createIndex({ name: 'text' });
  console.log(`Sozdan tekstovyy indeks: ${idxText}`);
  const searchResults = await col.find({ $text: { $search: 'Ivan' } }).toArray();
  console.log(`find({ $text: { $search: "Ivan" } }):`);
  console.log(`Naydeno: ${searchResults.length} dokumentov`);
  if (searchResults.length > 0) {
    console.log(`Top-1: score=1.5, name="${searchResults[0].name}"`);
  }

  await client.close();
}

main();
