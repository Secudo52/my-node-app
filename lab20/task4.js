const http = require('http');

let students = [
    { id: 1, name: 'Ivan', group: '477' },
    { id: 2, name: 'Mariya', group: '477' }
];
let nextId = 3;

function formatDate() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

const routes = [
    {
        method: 'GET',
        pattern: /^\/search$/,
        handler: async (req, res, params, query) => {
            const q = query.get('q') || '';
            const limit = parseInt(query.get('limit') || '10', 10);
            res.statusCode = 200;
            res.end(JSON.stringify({ q, limit }));
        }
    },
    {
        method: 'GET',
        pattern: /^\/users\/([^/]+)\/posts\/([^/]+)$/,
        handler: async (req, res, params) => {
            res.statusCode = 200;
            res.end(JSON.stringify({ userId: params[0], postId: params[1] }));
        }
    },
    {
        method: 'GET',
        pattern: /^\/users\/([^/]+)$/,
        handler: async (req, res, params) => {
            res.statusCode = 200;
            res.end(JSON.stringify({ id: params[0] }));
        }
    },
    {
        method: 'GET',
        pattern: /^\/api\/students$/,
        handler: async (req, res, params, query) => {
            const groupFilter = query.get('group');
            let result = students;
            if (groupFilter) {
                result = students.filter(s => s.group === groupFilter);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(result, null, 2));
        }
    },
    {
        method: 'GET',
        pattern: /^\/api\/students\/(\d+)$/,
        handler: async (req, res, params) => {
            const id = parseInt(params[0], 10);
            const student = students.find(s => s.id === id);
            if (!student) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Student ne nayden' }));
                return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(student));
        }
    },
    {
        method: 'POST',
        pattern: /^\/api\/students$/,
        handler: async (req, res) => {
            const data = await readJsonBody(req);
            const newStudent = {
                id: nextId++,
                name: data.name || 'Bez imeni',
                group: data.group || '477'
            };
            students.push(newStudent);
            res.statusCode = 201;
            res.end(JSON.stringify(newStudent));
        }
    },
    {
        method: 'PUT',
        pattern: /^\/api\/students\/(\d+)$/,
        handler: async (req, res, params) => {
            const id = parseInt(params[0], 10);
            const student = students.find(s => s.id === id);
            if (!student) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Student ne nayden' }));
                return;
            }
            const data = await readJsonBody(req);
            if (data.name) student.name = data.name;
            if (data.group) student.group = data.group;
            res.statusCode = 200;
            res.end(JSON.stringify(student));
        }
    },
    {
        method: 'DELETE',
        pattern: /^\/api\/students\/(\d+)$/,
        handler: async (req, res, params) => {
            const id = parseInt(params[0], 10);
            const idx = students.findIndex(s => s.id === id);
            if (idx === -1) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Student ne nayden' }));
                return;
            }
            students.splice(idx, 1);
            res.statusCode = 200;
            res.end(JSON.stringify({ deleted: true, id }));
        }
    }
];

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);
    const query = parsedUrl.searchParams;
    const method = req.method;

    res.setHeader('Content-Type', 'application/json');

    let matchedRoute = null;
    let matchedParams = [];
    let pathMatchesAnyMethod = false;

    for (const r of routes) {
        const match = pathname.match(r.pattern);
        if (match) {
            pathMatchesAnyMethod = true;
            if (r.method === method) {
                matchedRoute = r;
                matchedParams = match.slice(1);
                break;
            }
        }
    }

    if (matchedRoute) {
        try {
            await matchedRoute.handler(req, res, matchedParams, query);
        } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Oshibka obrabotki zaprosa' }));
        }
    } else if (pathMatchesAnyMethod) {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'text/plain');
        res.end('405 Method Not Allowed');
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Marshrut ne nayden' }));
    }

    console.log(`[${formatDate()}] [477] ${method} ${req.url} ${res.statusCode}`);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server task4 zapushen na portu ${PORT}`);
});
