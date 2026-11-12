const http = require('http');
const querystring = require('querystring');

const MAX_BODY_SIZE = 1024 * 1024;

const server = http.createServer((req, res) => {
    const { method, url, headers } = req;
    const contentType = headers['content-type'] || '';

    if (method === 'POST' && (url === '/echo' || url === '/form')) {
        let bodyChunks = [];
        let totalSize = 0;
        let isAborted = false;

        req.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_BODY_SIZE) {
                isAborted = true;
                res.statusCode = 413;
                res.setHeader('Content-Type', 'text/plain');
                res.end('413 Payload Too Large');
                req.destroy();
                console.log(`[LOG] 413 Payload Too Large (razmer > ${MAX_BODY_SIZE} bayt)`);
                return;
            }
            bodyChunks.push(chunk);
        });

        req.on('end', () => {
            if (isAborted) return;

            const rawBuffer = Buffer.concat(bodyChunks);
            const rawString = rawBuffer.toString('utf-8');
            console.log(`[LOG] ${method} ${url} | Razmer tela: ${rawBuffer.length} bayt | Content-Type: ${contentType}`);

            if (url === '/echo') {
                if (contentType.includes('application/json')) {
                    try {
                        const parsed = JSON.parse(rawString);
                        parsed.group = '477';
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(parsed, null, 2));
                    } catch (err) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Nekorrektniy JSON' }));
                    }
                } else if (contentType.includes('application/octet-stream')) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.end(rawBuffer);
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end(rawString);
                }
                return;
            }

            if (url === '/form') {
                const parsedForm = querystring.parse(rawString);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(parsedForm, null, 2));
                return;
            }
        });

        req.on('error', (err) => {
            console.error('[ERROR] Oshibka chteniya potoka:', err.message);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        });
        return;
    }

    res.statusCode = 404;
    res.end('Not Found');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server task3 zapushen na portu ${PORT}`);
});
