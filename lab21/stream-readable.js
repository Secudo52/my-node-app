const { Readable } = require('stream');

const chunksData = [
  'Gruppa: BBMO-01-23',
  'Student: Daniil Denishchik',
  'Laboratornaya rabota: No21',
  'Tema: Potoki v Node.js'
];

let index = 0;

const readableStream = new Readable({
  read() {
    if (index < chunksData.length) {
      this.push(chunksData[index]);
      index += 1;
    } else {
      this.push(null);
    }
  }
});

let chunkCount = 0;
let totalBytes = 0;

console.log('=== Demonstraciya Readable-potoka ===\n');

readableStream.on('data', (chunk) => {
  chunkCount += 1;
  totalBytes += chunk.length;
  console.log(`[CHUNK ${chunkCount}] ${chunk.toString()}`);
});

readableStream.on('end', () => {
  console.log('\n[END] Potok zavershen');
  console.log(`Vsego polucheno chankov: ${chunkCount}`);
  console.log(`Obshchiy razmer dannyh: ${totalBytes} bayt`);
});

readableStream.on('error', (err) => {
  console.error(`[ERR] Oshibka potoka: ${err.message}`);
});
