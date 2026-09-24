const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const swaggerUi = require('swagger-ui-express');
const NodeCache = require('node-cache');

const app = express();
app.use(express.json());

const cache = new NodeCache({ stdTTL: 300 });
const SECRET_KEY = 'secret_key_477_daniil';

let users = [];
let books = [];
let nextBookId = 1;

const genres = ['roman', 'detektiv', 'fantastika', 'nauka'];
for (let i = 1; i <= 100; i++) {
    books.push({
        id: nextBookId++,
        title: `Kniga ${i} Gruppa 477`,
        author: `Avtor ${i % 10}`,
        year: 1900 + (i % 120),
        genre: genres[i % genres.length],
        isbn: `ISBN-477-${i}`,
        available: i % 5 !== 0,
        reviews: []
    });
}

const swaggerDoc = {
    openapi: '3.0.0',
    info: { title: 'Library API', version: '1.0.0' },
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/auth/register': {
            post: {
                summary: 'Registraciya',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: {type: 'string'}, password: {type: 'string'}, name: {type: 'string'} } } } } },
                responses: { '201': { description: 'Uspeshno' } }
            }
        },
        '/auth/login': {
            post: {
                summary: 'Vhod',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: {type: 'string'}, password: {type: 'string'} } } } } },
                responses: { '200': { description: 'Token' } }
            }
        },
        '/api/books': {
            get: { summary: 'Poluchit knigi', responses: { '200': { description: 'Spisok knig' } } }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required(),
    name: Joi.string().required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required()
});

const bookSchema = Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    year: Joi.number().integer().min(1000).max(2026).required(),
    genre: Joi.string().required()
});

const checkAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Net tokena' });
    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Nedeystvitelniy token' });
    }
};

const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Tolko dlya adminov' });
    next();
};

const cacheGet = (req, res, next) => {
    if (req.method !== 'GET') return next();
    const cached = cache.get(req.originalUrl);
    if (cached) return res.json(cached);
    res.sendResponse = res.json;
    res.json = (body) => {
        cache.set(req.originalUrl, body);
        res.sendResponse(body);
    };
    next();
};

app.post('/auth/register', (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { email, password, name } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email zanyat' });
    const role = email === 'admin@mail.com' ? 'admin' : 'user';
    users.push({ email, password, name, role });
    res.status(201).json({ message: 'Uspeshno zaregistrirovan' });
});

app.post('/auth/login', (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Nevirniy login ili parol' });
    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

app.get('/api/books/available', checkAuth, cacheGet, (req, res) => {
    res.json(books.filter(b => b.available));
});

app.get('/api/books/export', checkAuth, checkAdmin, (req, res) => {
    res.json({ data: books, format: 'json' });
});

app.get('/api/books', checkAuth, cacheGet, (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const paginated = books.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    res.json({ total: books.length, data: paginated });
});

app.get('/api/books/:id', checkAuth, cacheGet, (req, res) => {
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Kniga ne naydena' });
    res.json(book);
});

app.post('/api/books', checkAuth, checkAdmin, (req, res) => {
    const { error } = bookSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const newBook = { id: nextBookId++, ...req.body, isbn: `ISBN-NEW-${Date.now()}`, available: true, reviews: [] };
    books.push(newBook);
    cache.flushAll();
    res.status(201).json(newBook);
});

app.delete('/api/books/:id', checkAuth, checkAdmin, (req, res) => {
    const index = books.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Kniga ne naydena' });
    books.splice(index, 1);
    cache.flushAll();
    res.json({ message: 'Uspeshno udaleno' });
});

app.post('/api/books/:id/reviews', checkAuth, (req, res) => {
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Kniga ne naydena' });
    if (!req.body.text) return res.status(400).json({ error: 'Pustoy otzyv' });
    book.reviews.push({ user: req.user.email, text: req.body.text });
    cache.flushAll();
    res.status(201).json({ message: 'Otzyv dobavlen' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zadanie 5: Server zapushen na http://localhost:${PORT}`);
});