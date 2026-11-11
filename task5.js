const EventEmitter = require('events');
const http = require('http');
const os = require('os');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.priorities = new Map();
        this.wildcardListeners = [];
        this.metrics = {
            events: {},
            total: 0,
            lastCalled: {},
            errors: 0
        };

        this.on('error', (err) => {
            console.log(`[ERROR] [477] Oshibka v slushatele: ${err.message}`);
        });
    }

    on(event, listener, priority = 0) {
        if (!this.priorities.has(event)) {
            this.priorities.set(event, []);
        }
        this.priorities.get(event).push({ listener, priority });
        this.priorities.get(event).sort((a, b) => b.priority - a.priority);
        super.on(event, listener);
        return this;
    }

    once(event, listener, priority = 0) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            listener(...args);
        };
        wrapper._original = listener;
        return this.on(event, wrapper, priority);
    }

    off(event, listener) {
        if (this.priorities.has(event)) {
            const list = this.priorities.get(event);
            const idx = list.findIndex(item => item.listener === listener || item.listener._original === listener);
            if (idx !== -1) {
                list.splice(idx, 1);
            }
        }
        super.off(event, listener);
        return this;
    }

    onAny(listener) {
        this.wildcardListeners.push(listener);
        return this;
    }

    emit(event, ...args) {
        this.metrics.total++;
        this.metrics.events[event] = (this.metrics.events[event] || 0) + 1;
        this.metrics.lastCalled[event] = new Date().toISOString();

        for (const wl of this.wildcardListeners) {
            try {
                wl(event, ...args);
            } catch (err) {
                this.metrics.errors++;
                this.emit('error', err);
            }
        }

        if (this.priorities.has(event)) {
            const list = [...this.priorities.get(event)];
            for (const item of list) {
                try {
                    item.listener(...args);
                } catch (err) {
                    this.metrics.errors++;
                    this.emit('error', err);
                }
            }
            return true;
        }

        return super.emit(event, ...args);
    }

    getMetrics() {
        const listenersCount = {};
        for (const event of this.eventNames()) {
            listenersCount[event] = this.listenerCount(event);
        }

        return {
            group: '477',
            events: this.metrics.events,
            total: this.metrics.total,
            listeners: listenersCount,
            system: {
                platform: os.platform(),
                freeMem: `${(os.freemem() / (1024 ** 2)).toFixed(0)} MB`
            }
        };
    }
}

function runDemo() {
    console.log('=== EventBus (gruppa 477) ===');

    const bus = new EventBus();

    console.log('\n--- Prioriteti ---');
    bus.on('action', () => console.log('[priority 0] Nizkiy prioritet'), 0);
    bus.on('action', () => console.log('[priority 10] Visokiy prioritet'), 10);
    bus.on('action', () => console.log('[priority 5] Sredniy prioritet'), 5);
    bus.emit('action');

    console.log('\n--- Wildcard ---');
    bus.onAny((event, ...args) => {
        console.log(`[onAny] Sobitie "${event}" s argumentami: ${JSON.stringify(args)}`);
    });
    bus.emit('greet', 'Ivan');
    bus.emit('info', '477');

    console.log('\n--- Once-kesh ---');
    let onceCalled = 0;
    bus.once('tick', () => {
        onceCalled++;
    });
    console.log('[tick] Vizov 1');
    bus.emit('tick');
    console.log('[tick] Vizov 2');
    bus.emit('tick');
    console.log('[tick] Vizov 3');
    bus.emit('tick');
    console.log(`once-slushatel vizvan: ${onceCalled} raz`);

    console.log('\n--- Obrabotka oshibok ---');
    bus.on('testError', () => {
        throw new Error('Oshibka v slushatele "test"');
    });
    bus.emit('testError');

    console.log('\n--- Metriki ---');
    console.log(`greet: ${bus.metrics.events['greet'] || 0} vizova`);
    console.log(`info: ${bus.metrics.events['info'] || 0} vizov`);
    console.log(`tick: ${bus.metrics.events['tick'] || 0} vizova`);
    console.log(`test: ${bus.metrics.events['testError'] || 0} vizova (1 oshibka)`);
    console.log(`Vsego sobitiy: ${bus.metrics.total}`);

    return bus;
}

if (process.argv.includes('--server')) {
    const bus = new EventBus();

    bus.on('request', (req, res) => {
        if (req.url === '/metrics') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(bus.getMetrics(), null, 2));
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        }
    });

    bus.emit('greet', 'Ivan');
    bus.emit('info', '477');
    bus.emit('tick');
    bus.emit('tick');
    bus.emit('tick');

    const server = http.createServer((req, res) => {
        bus.emit('request', req, res);
    });

    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`EventBus server zapushen na http://localhost:${PORT}`);
    });
} else {
    runDemo();
}

module.exports = EventBus;
