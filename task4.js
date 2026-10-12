const os = require('os');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'monitor.log');

function getCpuTimes() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    const total = user + nice + sys + idle + irq;
    const busy = total - idle;
    return { busy, total };
}

function writeAnomalyLog(message) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const logLine = `[${dateStr}] [GRUPPA 477] Preduprezhdenie: ${message}\n`;
    fs.appendFileSync(logFilePath, logLine, 'utf-8');
}

function collectSnapshot() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(2);
    const totalMemGB = (totalMem / (1024 ** 3)).toFixed(2);

    return {
        timestamp: new Date().toISOString(),
        group: '477',
        platform: os.platform(),
        arch: os.arch(),
        cpuCount: os.cpus().length,
        cpuModel: os.cpus().length > 0 ? os.cpus()[0].model : '',
        totalMemGB: `${totalMemGB} GB`,
        freeMemGB: `${freeMemGB} GB`,
        ramUsagePercent: `${ramUsagePercent}%`
    };
}

if (process.argv.includes('--snapshot')) {
    const snapshot = collectSnapshot();
    console.log(JSON.stringify(snapshot, null, 2));
    process.exit(0);
}

let warningCount = 0;
let prevCpu = getCpuTimes();

console.log('Monitoring (gruppa 477). Ctrl+C dlya vihoda.\n');

function checkMetrics(simulatedCpu) {
    const currentCpu = getCpuTimes();
    const totalDiff = currentCpu.total - prevCpu.total;
    const busyDiff = currentCpu.busy - prevCpu.busy;
    prevCpu = currentCpu;

    let cpuPercent = totalDiff > 0 ? ((busyDiff / totalDiff) * 100) : 0;
    if (typeof simulatedCpu === 'number') {
        cpuPercent = simulatedCpu;
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = ((usedMem / totalMem) * 100).toFixed(1);
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(2);
    const freePercent = ((freeMem / totalMem) * 100);

    let statusMark = '';
    if (cpuPercent > 80) {
        statusMark = '  ⚠⚠';
        warningCount++;
        writeAnomalyLog(`Kriticheskaya zagruzka CPU: ${cpuPercent.toFixed(1)}%`);
    } else if (cpuPercent > 50) {
        statusMark = '  ⚠';
        warningCount++;
        writeAnomalyLog(`Vysokaya zagruzka CPU: ${cpuPercent.toFixed(1)}%`);
    }

    if (freePercent < 10) {
        if (!statusMark) statusMark = '  ⚠';
        warningCount++;
        writeAnomalyLog(`Malo svobodnoy pamyati RAM: ${freePercent.toFixed(1)}% (${freeMemGB} GB svobodno)`);
    }

    console.log(`CPU: ${cpuPercent.toFixed(1)}% | RAM: ${ramPercent}% (${freeMemGB} GB svobodno)${statusMark}`);
}

process.on('SIGINT', () => {
    console.log(`\nMonitoring ostanovlen. Preduprezhdeniy: ${warningCount}`);
    process.exit(0);
});

if (process.argv.includes('--demo')) {
    checkMetrics(12.5);
    checkMetrics(78.9);
    checkMetrics(92.4);
    console.log(`\nMonitoring ostanovlen. Preduprezhdeniy: ${warningCount}`);
    process.exit(0);
}

setInterval(() => {
    checkMetrics();
}, 2000);