const http = require('http');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

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
const logFilePath = path.join(__dirname, 'server.log');

function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error('Oshibka loga:', err);
    });
}

app.on('server:started', (port) => {
    const msg = `Server zapyshchen na porty ${port}`;
    console.log(msg);
    writeLog(msg); });

app.on('request:received', (requestData) => {
    const msg = `Polychen zapros: ${requestData.method} ${requestData.url}`;
    console.log(msg);
    writeLog(msg); });

app.on('server:stopped', () => {
    const msg = `Servak ostanovlen`;
    console.log(msg);
    writeLog(msg); 
});

app.start(3000);

setTimeout(() => {
    app.stop();
}, 10000);
