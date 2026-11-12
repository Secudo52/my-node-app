const fs = require('fs');
const path = require('path');
const { Transform, pipeline } = require('stream');

const inputFile = path.join(__dirname, 'input.txt');
const pipeOutFile = path.join(__dirname, 'output-pipe.txt');
const pipelineOutFile = path.join(__dirname, 'output-pipeline.txt');
const chainOutFile = path.join(__dirname, 'output-chain.txt');

const sampleContent = 'Gruppa BBMO-01-23\nStudent Daniil Denishchik\nLaboratornaya rabota No21\nPotoki v Node.js\n'.repeat(12);
fs.writeFileSync(inputFile, sampleContent, 'utf8');

function demoPipeSuccess() {
  return new Promise((resolve) => {
    console.log('=== Demonstraciya pipe() ===');
    console.log('Chtenie: input.txt');
    console.log('Zapis: output-pipe.txt');
    const src = fs.createReadStream(inputFile);
    const dst = fs.createWriteStream(pipeOutFile);
    src.pipe(dst);
    dst.on('finish', () => {
      const size = fs.statSync(pipeOutFile).size;
      const same = fs.readFileSync(inputFile, 'utf8') === fs.readFileSync(pipeOutFile, 'utf8');
      console.log('[OK] Kopirovanie zaversheno');
      console.log(`Razmer: ${size} bayt, soderzhimoe sovpadaet: ${same}\n`);
      resolve();
    });
  });
}

function demoPipeError() {
  return new Promise((resolve) => {
    console.log('=== Demonstraciya pipe() s oshibkoy ===');
    console.log('Chtenie: missing.txt');
    const src = fs.createReadStream(path.join(__dirname, 'missing.txt'));
    const dst = fs.createWriteStream(path.join(__dirname, 'output-err-pipe.txt'));
    src.pipe(dst);
    src.on('error', (err) => {
      console.log(`[ERR] Oshibka: ${err.code}: ${err.message}`);
      console.log(`[WARN] Vnimanie: pipe() ne zakryl celevoy potok! dst.destroyed=${dst.destroyed}`);
      console.log('[WARN] Vozmozhna utechka pamyati.\n');
      dst.destroy();
      resolve();
    });
  });
}

function demoPipelineSuccess() {
  return new Promise((resolve, reject) => {
    console.log('=== Demonstraciya pipeline() ===');
    console.log('Chtenie: input.txt');
    console.log('Zapis: output-pipeline.txt');
    const src = fs.createReadStream(inputFile);
    const dst = fs.createWriteStream(pipelineOutFile);
    pipeline(src, dst, (err) => {
      if (err) {
        reject(err);
        return;
      }
      const same = fs.readFileSync(inputFile, 'utf8') === fs.readFileSync(pipelineOutFile, 'utf8');
      console.log(`[OK] Kopirovanie zaversheno, soderzhimoe sovpadaet: ${same}\n`);
      resolve();
    });
  });
}

function demoPipelineError() {
  return new Promise((resolve) => {
    console.log('=== Demonstraciya pipeline() s oshibkoy ===');
    console.log('Chtenie: missing.txt');
    const src = fs.createReadStream(path.join(__dirname, 'missing.txt'));
    const dst = fs.createWriteStream(path.join(__dirname, 'output-err-pipeline.txt'));
    pipeline(src, dst, (err) => {
      if (err) {
        console.log(`[ERR] Oshibka: ${err.code}: ${err.message}`);
        console.log(`[OK] Vse potoki avtomaticheski zakryty: src.destroyed=${src.destroyed}, dst.destroyed=${dst.destroyed}`);
        console.log('[OK] Utechek net\n');
      }
      resolve();
    });
  });
}

function demoChain() {
  return new Promise((resolve, reject) => {
    console.log('=== Cepochka potokov ===');
    console.log('input.txt -> uppercase -> reverse -> output-chain.txt');
    const uppercase = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
      }
    });
    const reverse = new Transform({
      transform(chunk, encoding, callback) {
        const reversed = chunk.toString().split('\n').map((l) => l.split('').reverse().join('')).join('\n');
        callback(null, reversed);
      }
    });
    const src = fs.createReadStream(inputFile);
    const dst = fs.createWriteStream(chainOutFile);
    pipeline(src, uppercase, reverse, dst, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('[OK] Obrabotka zavershena\n');
      resolve();
    });
  });
}

async function main() {
  await demoPipeSuccess();
  await demoPipeError();
  await demoPipelineSuccess();
  await demoPipelineError();
  await demoChain();
}

main().catch((err) => console.error(err));
