const http = require('http');
const EventEmitter = require('events');

class AppServer extends EventEmitter {
    constructor() {
        super();
        
        this.server = http.createServer((req, res) => {
            this.emit('request:received', { url: req.url, method: req.method });
            
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Hello from Event-Driven Server!');
        });
    }

    start(port) {
        this.server.listen(port, () => {
            this.emit('server:started', port);
        });
    }

    stop() {
        this.server.close(() => {
            this.emit('server:stopped');
        });
    }
}

const app = new AppServer();

app.on('server:started', (port) => {
    console.log(`Server zapyshchen na porty ${port}`);
});

app.on('request:received', (requestData) => {
    console.log(`Polychen zapros: ${requestData.method} ${requestData.url}`);
});

app.on('server:stopped', () => {
    console.log(`Servak sotanovlen`);
});

app.start(3000);

setTimeout(() => {
    app.stop();
}, 10000);
