const os = require('os');

function maskMac(mac) {
    if (!mac || mac === '00:00:00:00:00:00') return mac;
    const parts = mac.split(/[:-]/);
    if (parts.length === 6) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:**:**:**`;
    }
    return mac;
}

const interfaces = os.networkInterfaces();
const interfaceNames = Object.keys(interfaces);

let totalInterfacesCount = interfaceNames.length;
let mainInterface = null;

console.log('=== Setevie interfeysi ===');
for (const name of interfaceNames) {
    const netList = interfaces[name] || [];
    for (const net of netList) {
        const family = net.family === 'IPv4' || net.family === 4 ? 'IPv4' : 'IPv6';
        if (family === 'IPv4') {
            console.log(`Interfeys: ${name}`);
            console.log(`  IPv4:        ${net.address}`);
            console.log(`  MAC:         ${maskMac(net.mac)}`);
            console.log(`  Vnutrenniy:  ${net.internal ? 'da' : 'net'}\n`);
            if (!mainInterface && !net.internal) {
                mainInterface = `${name} (${net.address})`;
            }
        }
    }
}

if (!mainInterface && interfaceNames.length > 0) {
    mainInterface = interfaceNames[0];
}

console.log(`Vsego interfeysov:        ${totalInterfacesCount}`);
console.log(`Osnovnoy interfeys:       ${mainInterface || 'ne nayden'}\n`);

console.log('=== Informaciya o polzovatele ===');
let userInfo;
try {
    userInfo = os.userInfo();
} catch (e) {
    userInfo = { username: 'unknown', uid: -1, homedir: '', shell: null };
}

const isRoot = (userInfo.username === 'root' || userInfo.uid === 0) ? 'da' : 'net';

console.log(`Imya polzovatelya:         ${userInfo.username}`);
console.log(`UID:                      ${userInfo.uid}`);
console.log(`Domashnyaya direktoriya:      ${userInfo.homedir}\n`);

console.log('Gruppa:                   477');
console.log(`Proverka root:            ${isRoot}`);