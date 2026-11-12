const fs = require('fs');
const path = require('path');
const { Readable, Writable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

const TOTAL_RECORDS = 10000;
const BATCH_SIZE = 100;
const csvPath = path.join(__dirname, 'students.csv');
const errLogPath = path.join(__dirname, 'errors.log');

function createStudentSource(total) {
  let current = 0;
  return new Readable({
    objectMode: true,
    highWaterMark: 100,
    read() {
      const end = Math.min(current + BATCH_SIZE, total);
      while (current < end) {
        current += 1;
        const invalidName = current % 900 === 0;
        const invalidGrade = current % 1100 === 0;
        const grade = invalidGrade ? 7.5 : Number((2.5 + ((current * 17) % 25) / 10).toFixed(2));
        this.push({
          id: current,
          name: invalidName ? '' : `Student ${current}`,
          group: 'BBMO-01-23',
          course: (current % 4) + 1,
          grade
        });
      }
      if (current >= total) {
        this.push(null);
      }
    }
  });
}

function makePipelineRun() {
  return new Promise((resolve, reject) => {
    const stats = {
      generated: 0,
      validated: 0,
      enriched: 0,
      filtered: 0,
      written: 0,
      errors: 0,
      backpressureEvents: 0
    };
    const errorLines = [];
    const startTime = Date.now();
    let lastLoggedPct = 0;

    const source = createStudentSource(TOTAL_RECORDS);

    const validate = new Transform({
      objectMode: true,
      highWaterMark: 64,
      transform(student, encoding, callback) {
        stats.generated += 1;
        if (!student.name || student.name.trim().length === 0) {
          stats.errors += 1;
          errorLines.push(`[${new Date().toISOString()}] [BBMO-01-23] Oshibka validacii: id=${student.id}, otsutstvuet name`);
          callback();
          return;
        }
        if (typeof student.grade !== 'number' || student.grade < 0 || student.grade > 5) {
          stats.errors += 1;
          errorLines.push(`[${new Date().toISOString()}] [BBMO-01-23] Oshibka validacii: id=${student.id}, nekorrektnyy grade=${student.grade}`);
          callback();
          return;
        }
        stats.validated += 1;
        callback(null, student);
      }
    });

    const enrich = new Transform({
      objectMode: true,
      highWaterMark: 64,
      transform(student, encoding, callback) {
        stats.enriched += 1;
        const averageGrade = Number(((student.grade + 4.0) / 2).toFixed(2));
        callback(null, { ...student, averageGrade });
      }
    });

    const filter = new Transform({
      objectMode: true,
      highWaterMark: 64,
      transform(student, encoding, callback) {
        if (student.grade > 3) {
          stats.filtered += 1;
          callback(null, student);
          return;
        }
        callback();
      }
    });

    const format = new Transform({
      objectMode: true,
      highWaterMark: 64,
      transform(student, encoding, callback) {
        const line = `${student.id},${student.name},${student.group},${student.course},${student.grade},${student.averageGrade}\n`;
        callback(null, line);
      }
    });

    const fileOut = fs.createWriteStream(csvPath, { highWaterMark: 1024 });
    fileOut.write('id,name,group,course,grade,averageGrade\n');

    const progressSink = new Writable({
      highWaterMark: 1024,
      write(chunk, encoding, callback) {
        stats.written += 1;
        const ok = fileOut.write(chunk);
        const pct = Math.floor((stats.generated / TOTAL_RECORDS) * 100);
        if ((pct >= lastLoggedPct + 20 || stats.generated === TOTAL_RECORDS) && lastLoggedPct < 100) {
          lastLoggedPct = pct === 100 ? 100 : pct;
          const elapsed = Math.max((Date.now() - startTime) / 1000, 0.001);
          const speed = Math.round(stats.generated / elapsed);
          const filled = Math.round(pct / 5);
          const bar = '#'.repeat(filled) + '-'.repeat(20 - filled);
          console.log(`[PROGRESS] ${bar} ${pct}% | ${stats.generated}/${TOTAL_RECORDS} | ${speed} zapisey/sek`);
        }
        if (!ok) {
          stats.backpressureEvents += 1;
          fileOut.once('drain', callback);
        } else {
          callback();
        }
      },
      final(callback) {
        fileOut.end(callback);
      }
    });

    [source, validate, enrich, filter, format, progressSink].forEach((s) => {
      s.on('error', (err) => {
        errorLines.push(`[${new Date().toISOString()}] [BBMO-01-23] Stream error: ${err.message}`);
      });
    });

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, 10000);

    pipeline([source, validate, enrich, filter, format, progressSink], { signal: controller.signal })
      .then(() => {
        clearTimeout(timer);
        fs.writeFileSync(errLogPath, errorLines.join('\n') + '\n', 'utf8');
        const duration = ((Date.now() - startTime) / 1000).toFixed(3);
        const speed = Math.round(stats.generated / Math.max(Number(duration), 0.001));
        const sizeKb = (fs.statSync(csvPath).size / 1024).toFixed(1);
        resolve({ stats, duration, speed, sizeKb });
      })
      .catch((err) => {
        clearTimeout(timer);
        fs.writeFileSync(errLogPath, errorLines.join('\n') + '\n', 'utf8');
        reject(err);
      });
  });
}

function demoBackpressure() {
  return new Promise((resolve) => {
    console.log('\n=== Demonstraciya backpressure ===');
    let paused = false;
    const sink = new Writable({
      highWaterMark: 16,
      write(chunk, encoding, callback) {
        setTimeout(callback, 5);
      }
    });
    for (let i = 1; i <= 10; i += 1) {
      const ok = sink.write(`record-${i}-payload`);
      if (!ok && !paused) {
        paused = true;
        console.log(`[BACKPRESSURE] Writable perepolnen na ${i}-y zapisi`);
        console.log('[BACKPRESSURE] Pauza 10 ms');
        sink.once('drain', () => {
          console.log('[DRAIN] Prodolzhaem zapis');
          sink.end(() => resolve());
        });
        return;
      }
    }
    sink.end(() => resolve());
  });
}

function demoTimeoutAbort() {
  return new Promise((resolve) => {
    console.log('\n=== Otmena po taymautu ===');
    console.log('Zapusk s taymautom 100 ms...');
    const controller = new AbortController();
    const slowSource = new Readable({
      objectMode: true,
      read() {
        setTimeout(() => {
          if (!this.destroyed) {
            this.push({ id: 1 });
          }
        }, 500);
      }
    });
    const slowSink = new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        callback();
      }
    });
    setTimeout(() => controller.abort(), 100);
    pipeline([slowSource, slowSink], { signal: controller.signal })
      .then(() => resolve())
      .catch((err) => {
        if (err && err.name === 'AbortError') {
          console.log('[ERR] Taymaut! Obrabotka otmenena');
          console.log(`[OK] Vse potoki korrektno zakryty: source.destroyed=${slowSource.destroyed}, sink.destroyed=${slowSink.destroyed}`);
          console.log('[OK] Resursy osvobozhdeny');
        }
        resolve();
      });
  });
}

async function demoAsyncIteratorComparison() {
  console.log('\n=== Sravnenie s async iterator ===');
  const start = Date.now();
  const source = createStudentSource(TOTAL_RECORDS);
  let filteredCount = 0;
  for await (const student of source) {
    if (student.name && student.grade >= 0 && student.grade <= 5 && student.grade > 3) {
      filteredCount += 1;
    }
  }
  const sec = ((Date.now() - start) / 1000).toFixed(3);
  const speed = Math.round(TOTAL_RECORDS / Math.max(Number(sec), 0.001));
  console.log(`[ASYNC] Obrabotano: ${filteredCount} zapisey za ${sec} sek`);
  console.log(`Skorost: ${speed} zapisey/sek`);
}

async function main() {
  console.log('=== Konveyer obrabotki dannyh (gruppa BBMO-01-23) ===');
  console.log(`Istochnik: ${TOTAL_RECORDS} studentov`);
  console.log('Filtr: ocenka > 3\n');

  const res = await makePipelineRun();
  console.log('\n=== Rezultaty ===');
  console.log(`Vsego sgenerirovano: ${res.stats.generated}`);
  console.log(`Proshlo validaciyu: ${res.stats.validated}`);
  console.log(`Obogashcheno: ${res.stats.enriched}`);
  console.log(`Otfiltrovano: ${res.stats.filtered}`);
  console.log(`Zapisano v CSV: ${res.stats.written}`);
  console.log(`Oshibok: ${res.stats.errors}`);
  console.log(`Backpressure sobytiy: ${res.stats.backpressureEvents}`);
  console.log(`Vremya vypolneniya: ${res.duration} sek`);
  console.log(`Srednyaya skorost: ${res.speed} zapisey/sek`);
  console.log(`Fayl: students.csv (${res.sizeKb} KB)`);

  await demoBackpressure();
  await demoTimeoutAbort();
  await demoAsyncIteratorComparison();
}

main().catch((err) => console.error(err));
