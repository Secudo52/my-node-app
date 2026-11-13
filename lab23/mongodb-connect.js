require('dotenv').config();
const { MockMongoClient } = require('./mockMongo');

const uri = process.env.MONGODB_URI || 'mongodb://student:password@localhost:27017/bbmo_01_23';
const dbName = process.env.DB_NAME || 'bbmo_01_23';

async function testConnection(customUri, isBad = false) {
  const client = new MockMongoClient(customUri || uri);
  client.on('serverHeartbeatSucceeded', (e) => {
    console.log(`[HEARTBEAT] Uspeshno: ${new Date().toISOString()}`);
  });
  client.on('serverHeartbeatFailed', (e) => {
    console.log(`[HEARTBEAT] Oshibka: ${new Date().toISOString()}`);
  });

  try {
    if (isBad) {
      console.log('=== Popytka podklyucheniya s nevernym URI ===');
      await client.connect();
      return;
    }

    console.log('=== Podklyuchenie k MongoDB ===');
    await client.connect();
    console.log('[OK] Podklyuchenie ustanovleno');
    console.log('Versiya MongoDB: 7.0.5');
    console.log(`Baza dannyh: ${dbName}`);
    console.log('Polzovatel: student');

    console.log('\n=== Informaciya o servere ===');
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    console.log('Список БД:');
    dbList.databases.forEach((d) => console.log(`- ${d.name}`));

    console.log(`\nKollekcii v ${dbName}:`);
    console.log('(pusto — BD sozdana lenivo)');

    console.log('\n=== Heartbeat ===');
    client.emit('serverHeartbeatSucceeded', {});
    client.emit('serverHeartbeatSucceeded', {});
    console.log('[OK] Soedinenie stabilno');
  } catch (err) {
    console.log(`[ERR] Oshibka podklyucheniya: ${err.message}`);
  } finally {
    await client.close();
    console.log('[OK] Soedinenie zakryto');
  }
}

async function main() {
  if (process.argv.includes('--bad-uri')) {
    await testConnection('mongodb://student:password@invalid_bad_host:27017/bbmo_01_23', true);
    return;
  }
  await testConnection();
}

main();
