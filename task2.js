const os = require('os');

const cpus = os.cpus();
const cpuCount = cpus.length;
const cpuModel = cpus.length > 0 ? cpus[0].model : 'Neopredeleno';

let totalSpeed = 0;
for (const cpu of cpus) {
    totalSpeed += cpu.speed;
}
const avgSpeed = cpus.length > 0 ? Math.round(totalSpeed / cpus.length) : 0;

const totalMemBytes = os.totalmem();
const freeMemBytes = os.freemem();
const usedMemBytes = totalMemBytes - freeMemBytes;

const totalMemGB = (totalMemBytes / (1024 ** 3)).toFixed(2);
const freeMemGB = (freeMemBytes / (1024 ** 3)).toFixed(2);
const usedMemGB = (usedMemBytes / (1024 ** 3)).toFixed(2);
const usedPercent = ((usedMemBytes / totalMemBytes) * 100).toFixed(1);
const freePercent = ((freeMemBytes / totalMemBytes) * 100).toFixed(1);

const loadAvg = os.loadavg();
const isWindows = os.platform() === 'win32';
const loadAvgStr = isWindows ? '[Nedostupno dlya Windows]' : `[${loadAvg.map(n => n.toFixed(2)).join(', ')}]`;

console.log('=== Informaciya o processore ===');
console.log(`Kolichestvo logicheskih yader: ${cpuCount}`);
console.log(`Model processora:          ${cpuModel}`);
console.log(`Srednyaya chastota:            ${avgSpeed} MGc\n`);

console.log('=== Informaciya o pamyati ===');
console.log(`Obshiy obyom:                ${totalMemGB} GB`);
console.log(`Svobodno:                   ${freeMemGB} GB`);
console.log(`Ispolzovano:               ${usedMemGB} GB (${usedPercent}%)\n`);

console.log('=== Srednyaya zagruzka sistemi ===');
console.log(`Load Average (1, 5, 15 min): ${loadAvgStr}\n`);

console.log('Gruppa: 477');
if (freePercent < 20) {
    console.log(`Preduprezhdenie: malo svobodnoy pamyati! Svobodno lish ${freePercent}%`);
} else {
    console.log('Pamyat v norme');
}