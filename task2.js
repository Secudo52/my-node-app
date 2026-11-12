const EventEmitter = require('events');

const emitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

emitter.on('tick', (num) => {
    onCount++;
    console.log(`[tick #${num}] on-slushatel`);
});

emitter.once('tick', (num) => {
    onceCount++;
    console.log(`[tick #${num}] once-slushatel`);
});

console.log('=== Sravnenie on i once ===');
emitter.emit('tick', 1);
emitter.emit('tick', 2);
emitter.emit('tick', 3);

console.log(`\non-slushatel vizvan: ${onCount} raza`);
console.log(`once-slushatel vizvan: ${onceCount} raz\n`);

console.log('=== Upravlenie podpiskami ===');

const testEmitter = new EventEmitter();
const listener1 = () => {};
const listener2 = () => {};
const listener3 = () => {};

testEmitter.on('myEvent', listener1);
testEmitter.on('myEvent', listener2);
testEmitter.on('myEvent', listener3);

console.log(`Slushateley do udaleniya: ${testEmitter.listenerCount('myEvent')}`);

testEmitter.removeListener('myEvent', listener2);
console.log(`Slushateley posle udaleniya odnogo: ${testEmitter.listenerCount('myEvent')}`);

testEmitter.removeAllListeners('myEvent');
console.log(`Slushateley posle removeAllListeners: ${testEmitter.listenerCount('myEvent')}\n`);

console.log('=== Poryadok vizova ===');
const orderEmitter = new EventEmitter();

orderEmitter.on('run', () => {
    console.log('1. Perviy slushatel (gruppa 477)');
});

orderEmitter.on('run', () => {
    console.log('2. Vtoroy slushatel');
});

orderEmitter.on('run', () => {
    console.log('3. Tretiy slushatel');
});

orderEmitter.emit('run');
