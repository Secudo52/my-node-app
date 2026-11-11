const EventEmitter = require('events');

const emitter = new EventEmitter();

emitter.on('greet', (name) => {
    console.log(`[greet] Privet, ${name}!`);
});

emitter.on('info', (group) => {
    console.log(`[info] Gruppa: ${group}`);
});

emitter.on('bye', () => {
    console.log('[bye] Do svidaniya!');
});

console.log('=== Demonstraciya EventEmitter ===\n');

emitter.emit('greet', 'Ivan');
emitter.emit('info', '477');
emitter.emit('bye');

console.log('');
const unknownResult = emitter.emit('unknown');
console.log(`Sobitie "unknown" bez slushateley: ${unknownResult}`);

const greetResult = emitter.emit('greet', 'Ivan');
console.log(`Sobitie "greet" so slushatelyami: ${greetResult}`);
