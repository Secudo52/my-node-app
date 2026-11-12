const EventEmitter = require('events');

class PluginManager extends EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();

        this.on('newListener', (event, listener) => {
            console.log(`[newListener] Dobavlen slushatel "${event}"`);
        });

        this.on('removeListener', (event, listener) => {
            console.log(`[removeListener] Udalen slushatel "${event}"`);
        });
    }

    register(name, plugin) {
        this.plugins.set(name, plugin);
        console.log(`[PLUGIN] Zaregistrirovan: ${name}`);
        this.emit('plugin:registered', name);
        if (plugin.init) {
            plugin.init(this);
        }
    }

    unregister(name) {
        if (this.plugins.has(name)) {
            const plugin = this.plugins.get(name);
            if (plugin.cleanup) {
                plugin.cleanup(this);
            }
            this.plugins.delete(name);
            console.log(`[PLUGIN] Udalen: ${name}`);
            this.emit('plugin:removed', name);
        }
    }
}

async function runAdvancedDemo() {
    console.log('=== Sistema plaginov ===');
    const manager = new PluginManager();

    manager.on('plugin:registered', () => {});
    manager.on('plugin:removed', () => {});

    let logHandler = (msg) => console.log(`[LOG] ${msg}`);
    let alertHandler = (msg) => console.log(`[ALERT] ${msg}`);

    manager.register('LoggerPlugin', {
        init: (bus) => bus.on('log', logHandler),
        cleanup: (bus) => bus.removeListener('log', logHandler)
    });

    manager.register('AlertPlugin', {
        init: (bus) => bus.on('alert', alertHandler),
        cleanup: (bus) => bus.removeListener('alert', alertHandler)
    });

    manager.unregister('LoggerPlugin');

    console.log('\n=== Demonstraciya utechki ===');
    const leakEmitter = new EventEmitter();
    leakEmitter.setMaxListeners(2000);

    for (let i = 0; i < 10; i++) {
        leakEmitter.on('data', () => {});
    }
    console.log(`Slushateley do: ${leakEmitter.listenerCount('data')}`);

    for (let i = 0; i < 1000; i++) {
        leakEmitter.on('data', () => {});
    }
    console.log(`Slushateley posle dobavleniya 1000: ${leakEmitter.listenerCount('data')}`);

    leakEmitter.removeAllListeners('data');
    console.log(`Slushateley posle removeAllListeners: ${leakEmitter.listenerCount('data')}`);

    console.log('\n=== Asinhronnie slushateli ===');
    const asyncEmitter = new EventEmitter();

    asyncEmitter.on('asyncTask', async () => {
        await new Promise(r => setTimeout(r, 100));
        console.log('[477] async-slushatel zavershen cherez 100ms');
    });

    asyncEmitter.emit('asyncTask');
    console.log('[477] emit vizvan (ne zhdet async-slushatel)');

    await new Promise(r => setTimeout(r, 150));
}

runAdvancedDemo();
