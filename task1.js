const os = require('os');

function formatUptime(seconds) {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours} ch ${minutes} min ${secs} sek`;
}

function getPlatformDescription(platform) {
    if (platform === 'win32') {
        return 'Vi rabotaete v Windows';
    } else if (platform === 'linux') {
        return 'Vi rabotaete v Linux';
    } else if (platform === 'darwin') {
        return 'Vi rabotaete v macOS';
    } else {
        return 'Neizvestnaya platforma';
    }
}

const platform = os.platform();
const type = os.type();
const arch = os.arch();
const release = os.release();
const hostname = os.hostname();
const uptime = os.uptime();

console.log('=== Informaciya o sisteme (gruppa 477) ===');
console.log(`Platforma:      ${platform}`);
console.log(`Tip OS:         ${type}`);
console.log(`Arhitektura:    ${arch}`);
console.log(`Versiya OS:     ${release}`);
console.log(`Imya hosta:     ${hostname}`);
console.log(`Vremya raboti:  ${formatUptime(uptime)}\n`);
console.log(getPlatformDescription(platform));
