const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let books = [
    { id: 1, title: "Voyna i mir", author: "Tolstoy", year: 1869 },
    { id: 2, title: "Prestuplenie i nakazanie", author: "Dostoevskiy", year: 1866 }
];
let nextId = 3;

app.get('/api/books/search', (req, res) => {
    const author = req.query.author;
    if (!author) {
        return res.status(400).json({ error: "Ukazhite avtora", status: 400 });
    }
    const filtered = books.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
    res.json(filtered);
});

app.get('/api/books', (req, res) => {
    res.json(books);
});

app.get('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) {
        return res.status(404).json({ error: "Kniga ne naydena", status: 404 });
    }
    res.json(book);
});

app.post('/api/books', (req, res) => {
    const { title, author, year } = req.body;
    if (!title || !author || !year) {
        return res.status(400).json({ error: "Nevalidnie dannie", status: 400 });
    }
    const newBook = { id: nextId++, title, author, year };
    books.push(newBook);
    res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) {
        return res.status(404).json({ error: "Kniga ne naydena", status: 404 });
    }
    const { title, author, year } = req.body;
    if (!title && !author && !year) {
        return res.status(400).json({ error: "Nevalidnie dannie", status: 400 });
    }
    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = year;
    res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
    const index = books.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: "Kniga ne naydena", status: 404 });
    }
    books.splice(index, 1);
    res.json({ message: "Uspeshno udaleno" });
});

app.listen(port, () => {
    console.log(`Server zapushen na portu ${port}`);
});