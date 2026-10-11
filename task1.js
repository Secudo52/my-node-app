#!/usr/bin/env node

const args = process.argv.slice(2);

function showHelp() {
    console.log('Ispolzovanie: my-cli <komanda> [argumenti]');
    console.log('Dostupnie komandi:');
    console.log('  greet <imya>   - poprivetstvovat polzovatelya');
    console.log('  info           - vivesti informaciyu o gruppe');
}

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
}

const command = args[0];

if (command === 'greet') {
    const name = args[1] || 'Polzovatel';
    console.log(`Privet, ${name}! Dobro pozhalovat v CLI-prilozhenie gruppi 477.`);
    process.exit(0);
} else if (command === 'info') {
    console.log('Gruppa: 477');
    console.log('Student: Daniil Denishchik');
    console.log('Laboratornaya rabota: No17');
    console.log('Data: 2026-10-11');
    process.exit(0);
} else {
    console.error(`Oshibka: neizvestnaya komanda "${command}"`);
    console.error('Dlya spravki ispolzuyte: my-cli --help');
    process.exit(1);
}