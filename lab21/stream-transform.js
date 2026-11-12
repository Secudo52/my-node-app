const { Readable, Writable, Transform, pipeline } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const str = chunk.toString().trim();
    if (str) {
      this.push(`[BBMO-01-23] ${str.toUpperCase()}`);
    }
    callback();
  }
}

class JsonParserTransform extends Transform {
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: false });
  }
  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      try {
        this.push(JSON.parse(line));
      } catch (e) {
        callback(e);
        return;
      }
    }
    callback();
  }
}

class FilterTransform extends Transform {
  constructor(predicate) {
    super({ objectMode: true });
    this.predicate = predicate;
  }
  _transform(obj, encoding, callback) {
    if (this.predicate(obj)) {
      this.push(obj);
    }
    callback();
  }
}

function demoUpperCase() {
  return new Promise((resolve) => {
    console.log('=== Demonstraciya Transform-potoka (UpperCaseTransform) ===');
    const inputs = ['gruppa bbmo-01-23', 'student daniil denishchik'];
    const src = Readable.from(inputs);
    const upper = new UpperCaseTransform();
    const out = new Writable({
      write(chunk, encoding, callback) {
        console.log(`Vyhod: "${chunk.toString()}"`);
        callback();
      }
    });
    inputs.forEach((s) => console.log(`Vhod: "${s}"`));
    pipeline(src, upper, out, () => {
      console.log('');
      resolve();
    });
  });
}

function demoJsonAndObjectMode() {
  return new Promise((resolve) => {
    console.log('=== Demonstraciya JsonParserTransform i Object Mode ===');
    const jsonLines = [
      '{"id":1,"name":"Ivan","group":"BBMO-01-23"}\n',
      '{"id":2,"name":"Mariya","group":"BBMO-02-23"}\n',
      '{"id":3,"name":"Petr","group":"BBMO-01-23"}\n'
    ];
    const src = Readable.from(jsonLines);
    const parser = new JsonParserTransform();
    const filter = new FilterTransform((obj) => obj.group === 'BBMO-01-23');
    const out = new Writable({
      objectMode: true,
      write(obj, encoding, callback) {
        console.log('[OBJECT FILTERED]', JSON.stringify(obj));
        callback();
      }
    });
    console.log('Vhodnye JSON-stroki:');
    jsonLines.forEach((l) => console.log('[RAW]', l.trim()));
    console.log('Posle JsonParserTransform i FilterTransform (tolko BBMO-01-23):');
    pipeline(src, parser, filter, out, () => {
      console.log('');
      resolve();
    });
  });
}

async function demoAsyncIterator() {
  console.log('=== Demonstraciya async iterator ===');
  const readable = Readable.from(['Dannye 1', 'Dannye 2', 'Dannye 3']);
  let i = 0;
  for await (const chunk of readable) {
    i += 1;
    console.log(`[ASYNC] Poluchen chank ${i}: "${chunk}"`);
  }
  console.log('[ASYNC] Potok zavershen\n');
}

function demoChain() {
  return new Promise((resolve) => {
    console.log('=== Cepochka Transform ===');
    console.log('Chitaem -> UpperCase -> Filter -> Zapisyvaem');
    const rows = Array.from({ length: 10 }, (_, idx) => ({
      id: idx + 1,
      name: `student ${idx + 1}`,
      group: idx % 3 === 0 ? 'BBMO-02-23' : 'BBMO-01-23'
    }));
    let processed = 0;
    let passed = 0;
    const src = Readable.from(rows, { objectMode: true });
    const upperObj = new Transform({
      objectMode: true,
      transform(obj, encoding, callback) {
        processed += 1;
        callback(null, { ...obj, name: `[BBMO-01-23] ${obj.name.toUpperCase()}` });
      }
    });
    const filter = new FilterTransform((obj) => obj.group === 'BBMO-01-23');
    const dst = new Writable({
      objectMode: true,
      write(obj, encoding, callback) {
        passed += 1;
        callback();
      }
    });
    pipeline(src, upperObj, filter, dst, () => {
      console.log(`[OK] Obrabotano ${processed} obektov, otfiltrovano ${passed}`);
      resolve();
    });
  });
}

async function main() {
  await demoUpperCase();
  await demoJsonAndObjectMode();
  await demoAsyncIterator();
  await demoChain();
}

main().catch((err) => console.error(err));
