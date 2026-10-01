const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const logFile = path.join(__dirname, 'operations.log');

const writeLog = async (msg) => {
    try {
        const time = new Date().toISOString();
        await fs.appendFile(logFile, `[${time}] ${msg}\n`);
    } catch (e) {
        console.error('Oshibka zapisi loga:', e.message);
    }
};

let books = [
    { id: 1, title: "Voyna i mir", author: "Tolstoy", year: 1869, genre: "roman" },
    { id: 2, title: "Master i Margarita", author: "Bulgakov", year: 1967, genre: "roman" },
    { id: 3, title: "Prestuplenie i nakazanie", author: "Dostoevsky", year: 1866, genre: "roman" }
];
let nextId = 4;

app.get('/api/books/stats', async (req, res) => {
    await writeLog('GET /api/books/stats');
    const total = books.length;
    const byAuthor = {};
    const byGenre = {};
    let minYear = Infinity;
    let maxYear = -Infinity;

    books.forEach(b => {
        byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
        byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
        if (b.year < minYear) minYear = b.year;
        if (b.year > maxYear) maxYear = b.year;
    });

    if (total === 0) {
        minYear = null;
        maxYear = null;
    }

    res.json({ total, byAuthor, oldestYear: minYear, newestYear: maxYear, byGenre });
});

app.get('/api/books', async (req, res) => {
    await writeLog(`GET /api/books - query: ${JSON.stringify(req.query)}`);
    let result = [...books];
    const { author, year, yearFrom, yearTo, search, sort, limit = 10, page = 1 } = req.query;

    if (author) result = result.filter(b => b.author.toLowerCase() === author.toLowerCase());
    if (year) result = result.filter(b => b.year === parseInt(year));
    if (yearFrom) result = result.filter(b => b.year >= parseInt(yearFrom));
    if (yearTo) result = result.filter(b => b.year <= parseInt(yearTo));
    if (search) {
        const s = search.toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s));
    }

    if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.slice(1) : sort;
        result.sort((a, b) => {
            if (a[field] < b[field]) return isDesc ? 1 : -1;
            if (a[field] > b[field]) return isDesc ? -1 : 1;
            return 0;
        });
    }

    const l = parseInt(limit);
    const p = parseInt(page);
    const startIndex = (p - 1) * l;
    const paginated = result.slice(startIndex, startIndex + l);

    res.json({ totalFound: result.length, page: p, limit: l, data: paginated });
});

app.get('/api/books/:id', async (req, res) => {
    await writeLog(`GET /api/books/${req.params.id}`);
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Kniga ne naydena' });
    res.json(book);
});

app.post('/api/books', async (req, res) => {
    await writeLog(`POST /api/books - body: ${JSON.stringify(req.body)}`);
    const { title, author, year, genre } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'Pustoe nazvanie' });
    if (!year || isNaN(year)) return res.status(400).json({ error: 'Nekorrektniy god' });

    const duplicate = books.find(b => b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase());
    if (duplicate) return res.status(400).json({ error: 'Kniga uzhe sushchestvuet' });

    const newBook = { id: nextId++, title, author, year: parseInt(year), genre };
    books.push(newBook);
    res.status(201).json(newBook);
});

app.put('/api/books/:id', async (req, res) => {
    await writeLog(`PUT /api/books/${req.params.id} - body: ${JSON.stringify(req.body)}`);
    const id = parseInt(req.params.id);
    const index = books.findIndex(b => b.id === id);
    
    if (index === -1) return res.status(404).json({ error: 'Kniga ne naydena' });

    const { title, author, year, genre } = req.body;
    if (title !== undefined && !title.trim()) return res.status(400).json({ error: 'Pustoe nazvanie' });
    if (year !== undefined && isNaN(year)) return res.status(400).json({ error: 'Nekorrektniy god' });

    books[index] = { 
        ...books[index], 
        title: title || books[index].title, 
        author: author || books[index].author, 
        year: year ? parseInt(year) : books[index].year, 
        genre: genre || books[index].genre 
    };
    res.json(books[index]);
});

app.delete('/api/books/:id', async (req, res) => {
    await writeLog(`DELETE /api/books/${req.params.id}`);
    const id = parseInt(req.params.id);
    const index = books.findIndex(b => b.id === id);
    
    if (index === -1) return res.status(404).json({ error: 'Kniga ne naydena' });

    books.splice(index, 1);
    res.json({ message: 'Uspeshno udaleno' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zadanie 4: Server Express zapushen na http://localhost:${PORT}`);
});