const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    const date = new Date().toLocaleString('ru-RU');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Laboratornaya rabota 16</title>
        </head>
        <body>
            <h1>Laboratornaya rabota 16</h1>
            <p>Gruppa: 477</p>
            <p>Tekushaya data i vremya: ${date}</p>
            <p>Privet! Eto bazoviy server na Express.js.</p>
            <h3>Spisok dostupnih marshrutov:</h3>
            <ul>
                <li><a href="/">/ (Glavnaya)</a></li>
                <li><a href="/about">/about (O razrabotchike)</a></li>
                <li><a href="/contacts">/contacts (Kontakti)</a></li>
            </ul>
        </body>
        </html>
    `);
});

app.get('/about', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>O razrabotchike</title>
        </head>
        <body>
            <h1>O razrabotchike</h1>
            <p>Student: Daniil Denishchik</p>
            <p>Variant: 7</p>
            <a href="/">Nazad</a>
        </body>
        </html>
    `);
});

app.get('/contacts', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Kontakti</title>
        </head>
        <body>
            <h1>Kontaktnaya informaciya</h1>
            <p>Email: daniil.denishchik@example.com</p>
            <p>Telegram: @daniil_477</p>
            <a href="/">Nazad</a>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Server zapushen na portu ${port}`);
});