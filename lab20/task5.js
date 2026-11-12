const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC_DIR = path.join(__dirname, 'public');
const LOG_FILE = path.join(__dirname, 'access.log');
const STREAM_FILE = path.join(__dirname, 'big-sample.txt');

if (!fs.existsSync(STREAM_FILE)) {
    const chunk = 'Laboratornaya rabota No20 - Gruppa 477 - Streaming test data\n'.repeat(1000);
    fs.writeFileSync(STREAM_FILE, chunk, 'utf-8');
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
};

const cache = new Map();
const CACHE_TTL = 60000;

const metrics = {
    group: '477',
    total: 0,
    byMethod: {},
    byStatus: {},
    startTime: Date.now()
};

function formatDate() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

const middlewares = [
    (req, res, next) => {
        res.setHeader('X-Group', '477');
        next();
    },
    (req, res, next) => {
        res.on('finish', () => {
            metrics.total++;
            metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;
            const statusStr = String(res.statusCode);
            metrics.byStatus[statusStr] = (metrics.byStatus[statusStr] || 0) + 1;

            const logLine = `[${formatDate()}] [477] ${req.method} ${req.url} ${res.statusCode}`;
            console.log(logLine);
            fs.appendFile(LOG_FILE, logLine + '\n', () => {});
        });
        next();
    },
    (req, res, next) => {
        if (req.method === 'GET' && req.url !== '/metrics' && req.url !== '/stream' && !req.url.startsWith('/static/')) {
            const cached = cache.get(req.url);
            if (cached && (Date.now() - cached.time < CACHE_TTL)) {
                res.setHeader('Cache-Control', 'max-age=60');
                res.setHeader('X-Cache', 'HIT');
                res.statusCode = cached.status;
                res.end(cached.body);
                return;
            }
        }
        next();
    }
];

function runMiddlewares(req, res, index, finalHandler) {
    if (index >= middlewares.length) {
        return finalHandler(req, res);
    }
    try {
        middlewares[index](req, res, (err) => {
            if (err) {
                res.statusCode = 500;
                res.end('Internal Middleware Error');
                return;
            }
            runMiddlewares(req, res, index + 1, finalHandler);
        });
    } catch (err) {
        res.statusCode = 500;
        res.end('Internal Middleware Error');
    }
}

function handleRequest(req, res) {
    const urlPath = req.url.split('?')[0];

    if (req.method === 'GET' && urlPath.startsWith('/static/')) {
        const relPath = urlPath.replace('/static/', '');
        if (relPath.includes('..')) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end('403 Forbidden');
            return;
        }

        const filePath = path.join(PUBLIC_DIR, relPath);
        if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('404 Not Found');
            return;
        }

        const stat = fs.statSync(filePath);
        const content = fs.readFileSync(filePath);
        const etag = `"${crypto.createHash('md5').update(content).digest('hex').slice(0, 8)}"`;
        const lastModified = stat.mtime.toUTCString();

        res.setHeader('Cache-Control', 'max-age=60');
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', lastModified);

        if (req.headers['if-none-match'] === etag || req.headers['if-modified-since'] === lastModified) {
            res.statusCode = 304;
            res.end();
            return;
        }

        const ext = path.extname(filePath);
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        res.statusCode = 200;
        res.end(content);
        return;
    }

    if (req.method === 'GET' && urlPath === '/stream') {
        const stat = fs.statSync(STREAM_FILE);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', stat.size);
        res.statusCode = 200;
        const readStream = fs.createReadStream(STREAM_FILE);
        readStream.pipe(res);
        return;
    }

    if (req.method === 'GET' && urlPath === '/metrics') {
        const data = {
            group: metrics.group,
            total: metrics.total,
            byMethod: metrics.byMethod,
            byStatus: metrics.byStatus,
            uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
        };
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(data, null, 2));
        return;
    }

    if (req.method === 'GET' && urlPath === '/') {
        const isHttps = req.socket.encrypted;
        const body = isHttps
            ? '=== HTTPS rabotaet! ===\nGruppa: 477\n'
            : '=== HTTP rabotaet! ===\nGruppa: 477\n';
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'max-age=60');
        cache.set(req.url, { status: 200, body, time: Date.now() });
        res.statusCode = 200;
        res.end(body);
        return;
    }

    res.statusCode = 404;
    res.end('404 Not Found');
}

const appHandler = (req, res) => {
    runMiddlewares(req, res, 0, handleRequest);
};

const httpServer = http.createServer(appHandler);

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};
const httpsServer = https.createServer(httpsOptions, appHandler);

httpServer.on('error', (err) => {
    console.error('[ERROR] HTTP Server:', err.message);
});

httpServer.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

httpsServer.on('error', (err) => {
    console.error('[ERROR] HTTPS Server:', err.message);
});

httpsServer.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;

httpServer.listen(HTTP_PORT, () => {
    console.log(`[INFO] HTTP-server zapushen na portu ${HTTP_PORT}`);
});

httpsServer.listen(HTTPS_PORT, () => {
    console.log(`[INFO] HTTPS-server zapushen na portu ${HTTPS_PORT}`);
    console.log('[INFO] Gruppa: 477');
});

process.on('SIGINT', () => {
    console.log('\n[INFO] Poluchen signal SIGINT. Ostanovka serverov...');
    httpServer.close(() => {
        httpsServer.close(() => {
            console.log('[INFO] Serveri korrektno ostanovleni.');
            process.exit(0);
        });
    });
});
