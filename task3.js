const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "Slishkom mnogo zaprosov", status: 429 }
});

const loggerMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
        console.log(`[${date}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
};

app.use(loggerMiddleware);
app.use(compression());
app.use(limiter);
app.use(express.json());

app.get('/api/books', (req, res) => {
    res.json([{ id: 1, title: "Primernaya kniga" }]);
});

app.get('/error', (req, res) => {
    throw new Error("Sinteticheskaya oshibka");
});

app.get('/async-error', async (req, res, next) => {
    try {
        await new Promise((_, reject) => setTimeout(() => reject(new Error("Asinhronnaya oshibka")), 100));
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.log(`Oshibka poymana: ${err.message}`);
    res.status(500).json({
        error: "Vnutrennyaya oshibka servera",
        message: err.message,
        status: 500
    });
});

app.listen(port, () => {
    console.log(`Server zapushen na portu ${port}`);
});