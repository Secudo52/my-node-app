const { Writable } = require('stream');

const writableStream = new Writable({
  highWaterMark: 16,
  write(chunk, encoding, callback) {
    const text = chunk.toString();
    console.log(`[WRITE] ${text}`);
    setTimeout(() => {
      callback();
    }, 80);
  }
});

const items = [
  'Gruppa: BBMO-01-23',
  'Student: Daniil Denishchik',
  'Laboratornaya rabota: No21',
  'Tema: Potoki v Node.js'
];

let writtenCount = 0;

writableStream.on('finish', () => {
  console.log('\n[FINISH] Vse dannye zapisany');
  console.log(`Vsego zapisano: ${writtenCount} chanka`);
});

writableStream.on('error', (err) => {
  console.error(`[ERR] Oshibka zapisi: ${err.message}`);
});

console.log('=== Demonstraciya Writable-potoka ===\n');

function writeNext(i) {
  let ok = true;
  while (i < items.length && ok) {
    const item = items[i];
    i += 1;
    writtenCount += 1;
    ok = writableStream.write(item);
    console.log(`write() vernul: ${ok}${ok ? '' : ' <- bufer perepolnen!'}`);
    if (i === items.length) {
      writableStream.end();
      return;
    }
    if (!ok) {
      writableStream.once('drain', () => {
        console.log('\n[DRAIN] Bufer osvobozhden, prodolzhaem zapis');
        writeNext(i);
      });
      return;
    }
  }
}

writeNext(0);
