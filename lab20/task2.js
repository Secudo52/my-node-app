const http = require('http');

const server = http.createServer((req, res) => {
    const { method, url, httpVersion, headers } = req;

    if (method === 'GET' && url === '/headers') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Powered-By', 'Node.js');
        res.setHeader('X-Group', '477');
        res.setHeader('Cache-Control', 'no-cache');

        res.statusCode = 200;
        res.end(JSON.stringify({
            headers,
            method,
            url,
            httpVersion
        }, null, 2));
        return;
    }

    if (method === 'GET' && url === '/headers/set') {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Powered-By', 'Node.js');
        res.setHeader('X-Group', '477');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Temp-Header', 'to-be-removed');

        if (res.hasHeader('X-Temp-Header')) {
            res.removeHeader('X-Temp-Header');
        }

        res.statusCode = 200;
        res.end('<h1>Zagolovki ustanovleni</h1>');
        return;
    }

    if (method === 'GET' && url === '/headers/check') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Group', '477');

        const hasContentType = res.hasHeader('Content-Type');
        const hasXGroup = res.hasHeader('X-Group');
        const hasUnknown = res.hasHeader('X-Unknown');
        const currentType = res.getHeader('Content-Type');

        res.statusCode = 200;
        res.end(JSON.stringify({
            hasContentType,
            hasXGroup,
            hasUnknown,
            contentTypeValue: currentType
        }, null, 2));
        return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server task2 zapushen na portu ${PORT}`);
});
