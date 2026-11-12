const http = require('http');

function formatDate() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

const server = http.createServer((req, res) => {
    const { method, url } = req;
    let statusCode = 200;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (method === 'GET' && url === '/') {
        res.statusCode = 200;
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Laboratornaya rabota No20</title></head>
            <body>
                <h1>=== Laboratornaya rabota No20 ===</h1>
                <p>Gruppa: 477</p>
                <p>Metod: ${method}</p>
                <p>URL: ${url}</p>
            </body>
            </html>
        `);
    } else if (method === 'GET' && url === '/about') {
        res.statusCode = 200;
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>O studente</title></head>
            <body>
                <h1>=== O studente ===</h1>
                <p>Gruppa: 477</p>
                <p>Student: Daniil Denishchik</p>
            </body>
            </html>
        `);
    } else {
        statusCode = 404;
        res.statusCode = 404;
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>404 Not Found</title></head>
            <body>
                <h1>=== 404 Not Found ===</h1>
                <p>Put ${url} ne nayden</p>
            </body>
            </html>
        `);
    }

    console.log(`[${formatDate()}] ${method} ${url} ${statusCode}`);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server zapushen na portu ${PORT}`);
});
